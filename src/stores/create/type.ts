//风格，种族，身材，发型，个性，关系
export type CreateType =
  | "Style"
  | "Race"
  | "Body"
  | "Hair"
  | "Personality"
  | "Relationship";
export interface CreateTypeItem {
  name: string;
  type: CreateType;
  routerPath: string;
}
export interface CreateAIForm {
  style: string;
  ethnicity: string;
  age: string;
  eye_color: string;
  body_type: string;
  breast_size: string;
  butt_size: string;
  hair_style: string;
  hair_color: string;
  personality: string;
  relationship: string;
}
export type CardType = "BUTTON" | "IMAGE" | "AVATAR";
