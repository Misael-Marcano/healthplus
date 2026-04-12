import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class MarkReadItemDto {
  @IsIn(['validation_pending', 'comment', 'attachment'])
  kind: 'validation_pending' | 'comment' | 'attachment';

  @IsInt()
  @Min(1)
  id: number;
}

export class MarkReadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkReadItemDto)
  items: MarkReadItemDto[];
}
