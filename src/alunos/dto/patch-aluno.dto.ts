import { PartialType } from '@nestjs/mapped-types';
import { CreateAlunoDto } from './create-aluno.dto';

export class PatchAlunoDto extends PartialType(CreateAlunoDto, {
  skipNullProperties: false,
}) {}
