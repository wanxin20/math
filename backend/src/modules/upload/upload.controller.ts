import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { OssService } from './oss.service';

// 确保上传目录存在（OSS 启用时此目录仅作上传中转，上传成功后删除临时文件）
const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// 配置文件存储（始终先落本地磁盘，再决定是否转存 OSS —— 大文件可分片流式上传，内存友好）
const storage = diskStorage({
  destination: (req, file, cb) => {
    const folder = file.mimetype.startsWith('image/') ? 'images' : 'files';
    const dest = join(uploadDir, folder);
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// OSS 对象键白名单校验，避免签名任意对象
const SYSTEM_RE = /^[a-z]+$/;
const FOLDER_RE = /^(images|files)$/;
const FILENAME_RE = /^[A-Za-z0-9._-]+$/;

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger('UploadController');

  constructor(
    private configService: ConfigService,
    private readonly oss: OssService,
  ) {}

  /**
   * 生成「本地磁盘存储」的文件访问 URL（旧逻辑，OSS 未启用时使用）
   * - 如果配置了 APP_URL，使用完整 URL（生产环境推荐）
   * - 否则使用相对路径（开发环境或 Nginx 反向代理）
   * - 会根据 SYSTEM_PREFIX 环境变量自动添加系统前缀（paper 或 reform）
   */
  private getFileUrl(relativePath: string): string {
    const appUrl = this.configService.get<string>('APP_URL');
    const systemPrefix = this.configService.get<string>('SYSTEM_PREFIX') || 'paper';

    // 在 /uploads/ 后添加系统前缀
    // 例如：/uploads/images/xxx.jpg -> /uploads/paper/images/xxx.jpg
    const pathWithPrefix = relativePath.replace('/uploads/', `/uploads/${systemPrefix}/`);

    if (appUrl) {
      // 使用配置的完整 URL（生产环境）
      return `${appUrl}${pathWithPrefix}`;
    }

    // 使用相对路径（开发环境或 Nginx 代理）
    return pathWithPrefix;
  }

  /**
   * 生成「OSS 存储」的稳定访问 URL（指向后端签名跳转接口，长期有效、不暴露 AK，
   * 浏览器访问时后端再签发限时直链并 302 跳转到 OSS）
   * 注意：走 nginx 的 /api/{system}/ 反代（nginx 会把 /api/paper/ 重写到后端 /api/v1/），
   * 与前端其它 API 路径一致；不能用 /api/v1/（nginx 未路由该前缀，会落到 SPA）。
   * 例：https://competition.szmath.com/api/paper/upload/oss/paper/images/xxx.png
   */
  private getOssUrl(key: string): string {
    const appUrl = this.configService.get<string>('APP_URL') || '';
    const systemPrefix = this.configService.get<string>('SYSTEM_PREFIX') || 'paper';
    return `${appUrl}/api/${systemPrefix}/upload/oss/${key}`;
  }

  /** 修复中文文件名编码（Windows 下 originalname 可能是 Latin1） */
  private decodeName(originalname: string): string {
    try {
      return Buffer.from(originalname, 'latin1').toString('utf8');
    } catch (error) {
      this.logger.warn(`文件名编码转换失败，使用原始文件名: ${error}`);
      return originalname;
    }
  }

  /**
   * 统一处理上传结果：OSS 启用则转存 OSS（成功后删除本地临时文件），否则回退本地磁盘。
   */
  private async finalize(file: Express.Multer.File, folder: 'images' | 'files') {
    const originalName = this.decodeName(file.originalname);
    let fileUrl: string;

    if (this.oss.enabled) {
      const systemPrefix = this.configService.get<string>('SYSTEM_PREFIX') || 'paper';
      const key = `${systemPrefix}/${folder}/${file.filename}`;
      try {
        await this.oss.putFile(key, file.path, file.size);
        fileUrl = this.getOssUrl(key);
        // OSS 已保存，删除本地临时文件（失败仅告警，不影响主流程）
        unlink(file.path).catch((e) =>
          this.logger.warn(`删除本地临时文件失败 ${file.path}: ${e}`),
        );
      } catch (error) {
        // OSS 异常时回退到本地磁盘存储，保证用户上传不丢失
        this.logger.error(`OSS 上传失败，回退本地存储 (${key}): ${error}`);
        fileUrl = this.getFileUrl(`/uploads/${folder}/${file.filename}`);
      }
    } else {
      fileUrl = this.getFileUrl(`/uploads/${folder}/${file.filename}`);
    }

    return {
      filename: file.filename,
      originalname: originalName,
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl,
    };
  }

  @Post('file')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB（支持代码 / 预训练权重等大文件）
      },
      fileFilter: (req, file, cb) => {
        // 允许的文件类型（常见办公文档、压缩包、文本、图片、视频等）
        const allowedTypes = [
          // PDF
          'application/pdf',
          // Word 文档
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          // Excel 表格
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          // PowerPoint 演示文稿
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          // 压缩包（各浏览器/系统的 MIME 类型有差异，全部列出）
          'application/zip',
          'application/x-zip',
          'application/x-zip-compressed',
          'application/x-rar-compressed',
          'application/vnd.rar',      // RAR5 标准 MIME
          'application/x-rar',
          'application/x-7z-compressed',
          'application/gzip',
          'application/x-gzip',
          'application/x-tar',
          'application/x-bzip2',
          'application/x-xz',
          'application/zstd',
          // 文本文件
          'text/plain',
          'text/markdown',
          'text/csv',
          'application/rtf',
          // 图片
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/bmp',
          'image/svg+xml',
          // 视频
          'video/mp4',
          'video/quicktime',
          'video/x-msvideo',
          'video/mpeg',
          // 其他常见格式
          'application/json',
          'application/xml',
          'text/xml',
        ];

        const allowedExtensions = [
          // 压缩包（代码 / 预训练权重打包后上传）
          '.zip', '.rar', '.7z', '.gz', '.tar', '.tgz', '.bz2', '.xz', '.zst',
          // 代码（允许未压缩直传）
          '.py', '.ipynb',
          // 预训练权重（允许未压缩直传）
          '.pth', '.pt', '.ckpt', '.safetensors', '.h5', '.hdf5', '.onnx', '.bin', '.pkl', '.npy', '.npz', '.model',
          // 办公文档
          '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
          '.txt', '.md', '.rtf', '.csv',
          // 图片
          '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
          // 视频
          '.mp4', '.mov', '.avi', '.mpeg',
          // 其他
          '.json', '.xml',
        ];
        const ext = extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`不支持的文件类型: ${file.mimetype}（${ext}）`), false);
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    const folder = file.mimetype.startsWith('image/') ? 'images' : 'files';
    // 直接返回数据对象，TransformInterceptor会自动包装
    return this.finalize(file, folder);
  }

  @Post('image')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        // 只允许图片类型
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('只支持 JPG、PNG、GIF、WebP 格式的图片'), false);
        }
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    // 直接返回数据对象，TransformInterceptor会自动包装
    return this.finalize(file, 'images');
  }

  /**
   * OSS 文件访问入口（公开，无需登录，与原 nginx 静态 /uploads 行为一致）。
   * 后端按对象键签发限时直链，并 302 跳转到 OSS（私有 bucket 文件不直接对外暴露）。
   */
  @Public()
  @Get('oss/:system/:folder/:filename')
  @ApiOperation({ summary: '访问 OSS 文件（签名后跳转）' })
  async getOssFile(
    @Param('system') system: string,
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    if (!this.oss.enabled) {
      throw new NotFoundException('OSS 未启用');
    }
    // 严格校验，避免签名任意对象键
    if (!SYSTEM_RE.test(system) || !FOLDER_RE.test(folder) || !FILENAME_RE.test(filename)) {
      throw new BadRequestException('非法的文件路径');
    }
    const key = `${system}/${folder}/${filename}`;
    const signed = this.oss.signUrl(key, 3600);
    res.redirect(302, signed);
  }
}
