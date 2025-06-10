import  appConfig  from './app.config';
import  bullConfig  from './bull.config';
import  databaseConfig  from './database.config';
import  jwtConfig  from './jwt.config';

export default () => ({
  ...appConfig(),
  ...bullConfig(),
  ...databaseConfig(),
  ...jwtConfig(),
});