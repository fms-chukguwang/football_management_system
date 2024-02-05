import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type LoggingDocument = Logging & Document;

@Schema({ timestamps: { createdAt: 'timestamp', updatedAt: false } }) // createdAt을 timestamp로 변경 생성된 시간을 저장할 예정이고, 로그는 수정되지 않으므로 updatedAt은 false로 설정
export class Logging {
    @Prop()
    level: string;

    @Prop({ required: true })
    message: string;
}

const schema = SchemaFactory.createForClass(Logging);
schema.index({ createdAt: -1 });
export const LoggingSchema = schema;
