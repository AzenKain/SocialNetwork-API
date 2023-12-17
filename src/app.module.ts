import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule} from "@nestjs/typeorm"
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';
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
import { Roomchat } from './roomchat/romchat.entity';
import { PostEntity } from './post/post.entity';


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
        PostEntity
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
    
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
