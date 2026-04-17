import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomersNotificationsService } from 'src/modules/evolution/services/notifications/customers-notifications.service';
import { ContributorsNotificationsService } from 'src/modules/evolution/services/notifications/contributors-notifications.service';

@ApiTags('Admin - Broadcast')
@Controller('admin/broadcast')
export class BroadcastController {
  constructor(
    private readonly customersNotifications: CustomersNotificationsService,
    private readonly contributorsNotifications: ContributorsNotificationsService,
  ) {}

  @Post('new-edition')
  announceNewEdition() {
    return this.customersNotifications.announceNewEdition();
  }

  @Post('contributor-credentials')
  sendContributorCredentials() {
    return this.contributorsNotifications.sendWelcomeCredentialsAll();
  }
}
