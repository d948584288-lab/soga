import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Placeholder for upcoming JWT / session auth routes.
 * UI currently uses a client-side session until APIs are wired.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Get('status')
  @ApiOperation({ summary: 'Auth module readiness (placeholder)' })
  status() {
    return {
      module: 'auth',
      ready: false,
      message: 'Implement registration, login, and token issuance here.',
    };
  }
}
