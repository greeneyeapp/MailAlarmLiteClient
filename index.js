import { registerRootComponent } from 'expo';
import 'react-native-gesture-handler';

import App from './App';

// registerRootComponent çağrısı App.tsx'i uygulamanın ana bileşeni olarak kaydeder
registerRootComponent(App);