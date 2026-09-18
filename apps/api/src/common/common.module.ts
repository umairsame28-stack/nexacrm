import { Global, Module } from '@nestjs/common';
import { CryptoService } from './utils/crypto.service';

/**
 * Global module that exports cross-cutting utilities.
 * Import this once in AppModule; all feature modules can inject CryptoService.
 */
@Global()
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CommonModule {}
