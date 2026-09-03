export interface Department {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface TicketType {
  id: string;
  departmentId: string;
  name: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  departmentId?: string;
  typeId?: string;
  name: string;
  parentId?: string;
  isActive: boolean;
}

export interface Priority {
  id: string;
  name: string;
  weight: number;
  colorToken?: string;
  isActive: boolean;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  position: number;
  isInitial: boolean;
  isFinal: boolean;
  isActive: boolean;
}

export interface PipelineTransition {
  id: string;
  pipelineId: string;
  fromStageId: string;
  toStageId: string;
  name?: string;
  isActive: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  isActive: boolean;
  stages?: PipelineStage[];
  transitions?: PipelineTransition[];
}
