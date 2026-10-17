import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import styles from './Vehicle.module.css';
import type { VehicleFileUploadProps } from './vehicleManage.interface';

export default function VehicleFileUpload({
  onUpload,
}: VehicleFileUploadProps) {
  // 파일 및 업로드 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 지원하는 파일 형식 검사
  const isValidFile = (fileName: string): boolean => {
    const allowedExtensions = ['.xlsx', '.xls'];

    return allowedExtensions.some((extension) =>
      fileName.toLowerCase().endsWith(extension),
    );
  };

  // 파일 선택 및 유효성 검사
  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!isValidFile(file.name)) {
      window.alert(
        'xlsx, xls 파일만 업로드할 수 있습니다.',
      );

      event.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // 선택한 파일 및 input 초기화
  const handleReset = () => {
    if (isUploading) return;

    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 파일 업로드 처리
  const handleUpload = async () => {
    if (!selectedFile || isUploading) {
      if (!selectedFile) {
        window.alert('업로드할 파일을 선택해주세요.');
      }

      return;
    }

    try {
      setIsUploading(true);

      await onUpload(selectedFile);
    } catch {
      window.alert(
        '파일 업로드에 실패했습니다. 다시 시도해주세요.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.vehicleContent}>
      {/* 페이지 헤더 */}
      <div className={styles.contentHeader}>
        <div>
          <h3>차량 정보 파일 업로드</h3>

          <p>
            엑셀 파일을 선택하여 차량 정보를
            업로드합니다.
          </p>
        </div>
      </div>

      {/* 파일 선택 영역 */}
      <div className={`${styles.fileUpload} ${styles.excel}`}>
        <input
          ref={fileInputRef}
          id="vehicleFile"
          type="file"
          accept=".xlsx,.xls "
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <label
          htmlFor="vehicleFile"
          className={styles.fileUploadLabel}
        >
          <span className={styles.fileUploadIcon}>
            📊
          </span>

          <span className={styles.fileUploadText}>
            <span className={styles.fileUploadTitle}>
              Excel 파일 선택
            </span>

            <span className={styles.fileUploadDescription}>
              XLSX, XLS 파일을 지원합니다.
            </span>
          </span>

          <span className={styles.fileUploadButton}>
            파일 선택
          </span>
        </label>

        {/* 선택한 파일 정보 */}
        {selectedFile && (
          <div className={styles.fileSelected}>
            <span className={styles.fileSelectedIcon}>
              ✓
            </span>

            <span className={styles.fileSelectedInfo}>
              <span className={styles.fileSelectedName}>
                {selectedFile.name}
              </span>

              <span className={styles.fileSelectedType}>
                차량 정보 파일
              </span>
            </span>

            <button
              type="button"
              className={styles.fileRemoveButton}
              onClick={handleReset}
              aria-label="파일 삭제"
              disabled={isUploading}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleReset}
          disabled={isUploading}
        >
          초기화
        </button>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? '업로드 중...' : '파일 업로드'}
        </button>
      </div>
    </div>
  );
}