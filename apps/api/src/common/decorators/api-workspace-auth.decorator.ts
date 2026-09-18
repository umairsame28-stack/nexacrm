import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

/**
 * Combines JWT Bearer auth + X-Workspace-ID header for Swagger.
 *
 * Apply to any controller (or individual endpoint) that is protected by both
 * JwtAuthGuard and WorkspaceGuard.
 *
 * Usage:
 *   @ApiWorkspaceAuth()        ← on the controller class
 *   @Controller('contacts')
 *   export class ContactsController { ... }
 *
 * This causes Swagger to send both:
 *   Authorization: Bearer <token>
 *   X-Workspace-ID: <workspace-id>
 */
export function ApiWorkspaceAuth(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiBearerAuth('JWT'),
    ApiSecurity('WorkspaceID'),
  );
}
