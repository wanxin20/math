import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  data: T;
  message: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T> | StreamableFile> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T> | StreamableFile> {
    return next.handle().pipe(
      map((data) => {
        // 文件流（如 Excel 导出）不包装成 JSON，直接返回由框架发送
        if (data instanceof StreamableFile) {
          return data;
        }
        return {
          code: 200,
          data,
          message: 'success',
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
