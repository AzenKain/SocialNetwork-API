import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule} from "@nestjs/typeorm"
import { UserModule } from './user/user.module';
import { User } from './user/type/user.entity';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MediaModule } from './media/media.module';
import { FirebaseModule } from './firebase/firebase.module';
import { FileUpload } from './media/type';
import { JwtModule } from '@nestjs/jwt';
import { RoomchatModule } from './roomchat/roomchat.module';
import { MessageModule } from './message/message.module';
import { PostModule } from './post/post.module';
import { InteractionModule } from './interaction/interaction.module';
import { Roomchat } from './roomchat/type/romchat.entity';
import { PostEntity } from './post/type/post.entity';
import { CommitEntity } from './commit/commit.entity';
import { CommitModule } from './commit/commit.module';
import { MailerModule } from '@nestjs-modules/mailer/';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { OtpCode } from './user/type/otpCode.entity';
import { PaymentModule } from './payment/payment.module';
import { BillEntity } from './payment/type/bill.entity';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
      global: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'src/schema.gql'
    }),
    UserModule,
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: "mongodb://localhost/instagram",
      synchronize: true,
      useUnifiedTopology: true,
      entities: [
        User,
        FileUpload,
        Roomchat,
        PostEntity,
        CommitEntity,
        OtpCode,
        BillEntity
      ]
    }),
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true
    }),
    MediaModule,
    FirebaseModule,
    RoomchatModule,
    MessageModule,
    PostModule,
    InteractionModule,
    CommitModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        // transport: config.get('MAIL_TRANSPORT'),
        transport: {
          host: config.get('MAIL_HOST'),
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
          port: 587,
        },
        defaults: {
          from: `"No Reply" <${config.get('MAIL_FROM')}>`,
        },
        template: {
          dir: process.cwd() + '/templates/',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
