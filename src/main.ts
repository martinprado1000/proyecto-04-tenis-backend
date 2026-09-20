import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('bootstrap')

  // Los logos se envían como Data URL dentro del JSON. 3 MB de imagen pueden ocupar más de 4 MB codificados en Base64.
  app.use(bodyParser.json({ limit: '8mb' }));
  app.use(bodyParser.urlencoded({ limit: '8mb', extended: true }));

  app.setGlobalPrefix('api')
  
  //app.enableCors();
  app.enableCors({
    origin: true,
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist:true,
    //forbidNonWhitelisted: true,
    transform:true,
    transformOptions:{
      enableImplicitConversion: true,
    }
  })); 

  const config = new DocumentBuilder()
    .setTitle('Plantilla RESTFul API')
    .setDescription('Plantilla endpoints')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);  
  SwaggerModule.setup('api', app, documentFactory);

  const configService = app.get(ConfigService)
 
  const PORT = configService.get<number>('port')
  
  await app.listen(Number(PORT));
  
  logger.log(`App runing on port ${PORT}`)

}
bootstrap();
