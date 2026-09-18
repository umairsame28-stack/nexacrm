import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

/**
 * Custom validation pipe with project-standard settings.
 */
export class CustomValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: false, // don't throw on unknown props (whitelist handles it)
      transform: true,           // auto-transform plain objects to class instances
      transformOptions: {
        enableImplicitConversion: true, // convert query param strings to numbers/booleans
      },
      validationError: {
        target: false,
        value: false,
      },
      ...options,
    });
  }
}
