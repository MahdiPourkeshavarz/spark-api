/* eslint-disable prettier/prettier */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, unique: true, trim: true })
  text: string;

  @Prop({ required: true, trim: true })
  author: string;

  @Prop({ default: 'fa' })
  lang: string;

  @Prop({ required: false })
  source?: string;

  @Prop({ required: false })
  imageUrl?: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
