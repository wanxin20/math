import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Request } from 'express';

// 确保上传目录存在
const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// 配置文件存储
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

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(private configService: ConfigService) {}

  /**
   * 生成文件访问 URL
   * - 如果配置了 APP_URL，使用完整 URL（生产环境推荐）
   * - 否则使用相对路径（开发环境或 Nginx 反向代理）
   * - 会根据 SYSTEM_PREFIX 环境变量自动添加系统前缀（paper 或 reform）
   */
  private getFileUrl(req: Request, relativePath: string): string {
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
    // 前端会自动拼接当前域名
    return pathWithPrefix;
  }
  @Post('file')
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
      fileFilter: (req, file, cb) => {
        // 允许的文件类型
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'video/mp4',
          'video/quicktime',
          'application/zip',
        ];

        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('不支持的文件类型'), false);
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }

    const folder = file.mimetype.startsWith('image/') ? 'images' : 'files';
    const relativePath = `/uploads/${folder}/${file.filename}`;
    const fileUrl = this.getFileUrl(req, relativePath);

    // 修复中文文件名编码问题
    // file.originalname在Windows下可能是Latin1编码，需要转换为UTF-8
    let originalName = file.originalname;
    try {
      // 尝试将Latin1解码为UTF-8
      originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (error) {
      // 如果转换失败，使用原始文件名
      console.warn('文件名编码转换失败，使用原始文件名', error);
    }

    // 直接返回数据对象，TransformInterceptor会自动包装
    return {
      filename: file.filename,
      originalname: originalName,
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl,
    };
  }

  @Post('image')
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
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }

    const relativePath = `/uploads/images/${file.filename}`;
    const fileUrl = this.getFileUrl(req, relativePath);

    // 修复中文文件名编码问题
    let originalName = file.originalname;
    try {
      originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (error) {
      console.warn('文件名编码转换失败，使用原始文件名', error);
    }

    // 直接返回数据对象，TransformInterceptor会自动包装
    return {
      filename: file.filename,
      originalname: originalName,
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl,
    };
  }
}
