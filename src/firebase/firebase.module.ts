import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { initializeApp } from "firebase/app";
import { FirebaseService } from './firebase.service';

const firebaseProvider = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const firebaseConfig = {
      apiKey: configService.get<string>('ApiKey'),
      authDomain: configService.get<string>('AuthDomain'),
      projectId: configService.get<string>('ProjectId'),
      storageBucket: configService.get<string>('StorageBucket'),
      messagingSenderId: configService.get<string>('MessagingSenderId'),
      appId: configService.get<string>('AppId'),
      measurementId: configService.get<string>('MeasurementId')
    };

    return initializeApp(firebaseConfig);
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [FirebaseService, firebaseProvider],
  exports: [FirebaseService],
})

export class FirebaseModule {}
