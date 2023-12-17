import { Inject, Injectable } from '@nestjs/common';
import { getStorage,} from 'firebase/storage';
import { FirebaseApp } from "firebase/app";

@Injectable()
export class FirebaseService {
    storage: any;
    constructor(@Inject('FIREBASE_APP') private firebaseApp: FirebaseApp ) {
      this.storage = getStorage(firebaseApp);
    } 
}
