import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsEmail,
  IsNumber,
  IsIn,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScientistMaterialDto {
  @IsString()
  @IsIn(['form', 'certificate', 'papers', 'attachment', 'memberForm'])
  category: string;

  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(2048)
  fileUrl: string;

  @IsOptional()
  @IsNumber()
  size?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimetype?: string;
}

export class CreateScientistApplicationDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  gender?: string;

  @IsString()
  @MaxLength(200)
  institution: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsString()
  @MaxLength(30)
  phone: string;

  @IsEmail()
  @MaxLength(120)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  researchField?: string;

  @IsOptional()
  @IsBoolean()
  isSocietyMember?: boolean;

  @IsOptional()
  @IsBoolean()
  willingSponsorConference?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScientistMaterialDto)
  materials?: ScientistMaterialDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

/** 修改/补交：与提交同结构（整体覆盖） */
export class UpdateScientistApplicationDto extends CreateScientistApplicationDto {}
