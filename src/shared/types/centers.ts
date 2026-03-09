// src/shared/types/centers.ts
export type CenterLiteDto = {
  centerId: number;
  name: string;
  code: string;
};

export type CenterDto = {
  centerId: number;
  name: string;
  code: string;
  email: string;
  phone: string;
  establishedDate?: string | null; // "YYYY-MM-DD"
  description?: string | null;
  addressLine: string;
  province: string;
  district: string;
  ward: string;
  active: boolean;          // computed: deletedAt === null
  createdAt: string;        // ISO datetime
  updatedAt?: string;       // ISO datetime
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedAt?: string | null;
};

// Form DTOs (BE dev1)
export type CreateCenterDto = {
  name: string;
  code: string;
  email: string;
  phone: string;
  establishedDate?: string; // "YYYY-MM-DD"
  description?: string;
  addressLine: string;
  province: string;
  district: string;
  ward: string;
};

export type UpdateCenterDto = CreateCenterDto;

// Optional helper groups
export type CenterSummary = Pick<CenterDto, 'centerId' | 'name' | 'code' | 'province' | 'active'>;
export type CenterLocation = Pick<CenterDto, 'addressLine' | 'province' | 'district' | 'ward'>;
export type CenterContact = Pick<CenterDto, 'email' | 'phone'>;

export type CenterStatus = 'active' | 'inactive' | 'all';
