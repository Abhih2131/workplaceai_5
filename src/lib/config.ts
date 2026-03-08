/**
 * Master File Test Mode Configuration
 * 
 * Change MASTER_FILE_NAME to point to a different Excel file.
 * The file must be placed in the public/data/ folder.
 * Set MASTER_FILE_TEST_MODE to false to restore normal upload flow.
 */
export const MASTER_FILE_TEST_MODE = false;
export const MASTER_FILE_NAME = 'employee_master.xlsx';
export const MASTER_FILE_PATH = `/data/${MASTER_FILE_NAME}`;
export const MASTER_FILE_PREFERRED_SHEET = 'Master';
