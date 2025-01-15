import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type LoggingDocument = Logging & Document;

@Schema({ timestamps: { createdAt: 'timestamp', updatedAt: false } })
export class Logging {
    @Prop()
    level: string;

    @Prop({ required: true })
    message: string;
}

const schema = SchemaFactory.createForClass(Logging);
schema.index({ createdAt: -1 });
export const LoggingSchema = schema;
