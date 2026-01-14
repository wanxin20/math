import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: '教师教研论文评选平台后端服务运行正常',
    };
  }

  getInfo() {
    return {
      name: '教师教研论文评选平台',
      version: '1.0.0',
      description: 'Teacher Research Paper Selection Platform Backend Service',
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
    };
  }
}
