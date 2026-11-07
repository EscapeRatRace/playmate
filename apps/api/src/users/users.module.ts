import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { AccountDeletionController } from "./account-deletion.controller";
import { FriendsController } from "./friends.controller";
import { GroupsController } from "./groups.controller";
import { LegalController } from "./legal.controller";

@Module({
  controllers: [UsersController, AccountDeletionController, FriendsController, GroupsController, LegalController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
