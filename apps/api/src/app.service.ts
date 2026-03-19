import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'baby-bites-api',
      timestamp: new Date().toISOString(),
    };
  }
}
