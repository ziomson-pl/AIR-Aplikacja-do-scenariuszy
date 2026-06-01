export class CreateLineDto {
  characterId?: string | null;
  text: string;
  type: 'dialogue' | 'narrator';
}
