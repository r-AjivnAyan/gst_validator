// Fix: Define and export enums and interfaces used throughout the application.
export enum ValidationStatus {
  CORRECT = 'CORRECT',
  INCORRECT_CALCULATION = 'INCORRECT_CALCULATION',
  INCORRECT_TAX_SLAB = 'INCORRECT_TAX_SLAB',
  SUSPICIOUS = 'SUSPICIOUS',
  MISSING_INFO = 'MISSING_INFO',
  UNKNOWN = 'UNKNOWN',
}

export interface BillItem {
  itemName: string;
  quantity: number;
  price: number;
  total: number;
  taxAmount: number;
  status: ValidationStatus;
  suggestion?: string;
}

export interface AnalysisResult {
  overallStatus: 'VERIFIED' | 'ISSUES_FOUND';
  storeName: string;
  billDate: string;
  totalTax: number;
  totalAmount: number;
  items: BillItem[];
}

export interface HistoryItem extends AnalysisResult {
  id: string;
  timestamp: string;
}

export interface HsnResult {
  code: string;
  description: string;
  igst: string;
  cgst: string;
  sgst: string;
  details: string;
}

// NEW: Add a list of Indian states and UTs for location-specific tax rules.
export enum IndianStates {
  ANDAMAN_AND_NICOBAR_ISLANDS = 'Andaman and Nicobar Islands',
  ANDHRA_PRADESH = 'Andhra Pradesh',
  ARUNACHAL_PRADESH = 'Arunachal Pradesh',
  ASSAM = 'Assam',
  BIHAR = 'Bihar',
  CHANDIGARH = 'Chandigarh',
  CHHATTISGARH = 'Chhattisgarh',
  DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU = 'Dadra and Nagar Haveli and Daman and Diu',
  DELHI = 'Delhi',
  GOA = 'Goa',
  GUJARAT = 'Gujarat',
  HARYANA = 'Haryana',
  HIMACHAL_PRADESH = 'Himachal Pradesh',
  JAMMU_AND_KASHMIR = 'Jammu and Kashmir',
  JHARKHAND = 'Jharkhand',
  KARNATAKA = 'Karnataka',
  KERALA = 'Kerala',
  LADAKH = 'Ladakh',
  LAKSHADWEEP = 'Lakshadweep',
  MADHYA_PRADESH = 'Madhya Pradesh',
  MAHARASHTRA = 'Maharashtra',
  MANIPUR = 'Manipur',
  MEGHALAYA = 'Meghalaya',
  MIZORAM = 'Mizoram',
  NAGALAND = 'Nagaland',
  ODISHA = 'Odisha',
  PUDUCHERRY = 'Puducherry',
  PUNJAB = 'Punjab',
  RAJASTHAN = 'Rajasthan',
  SIKKIM = 'Sikkim',
  TAMIL_NADU = 'Tamil Nadu',
  TELANGANA = 'Telangana',
  TRIPURA = 'Tripura',
  UTTAR_PRADESH = 'Uttar Pradesh',
  UTTARAKHAND = 'Uttarakhand',
  WEST_BENGAL = 'West Bengal',
}
