import { useState } from 'react';

export interface NoticeFormData {
    category: string;
    title: string;
    content: string;
    isImportant: boolean;
    isPinned: boolean;
    files: File[];
}

interface AdminNoticeFormProps {
    onRegister: (formData: NoticeFormData) => void;
    onCancel: () => void;
}

export default function AdminNoticeForm({
    onRegister,
    onCancel,
}: AdminNoticeFormProps) {
    const [category, setCategory] = useState('이용안내');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isImportant, setIsImportant] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const selectedFiles = Array.from(e.target.files ?? []);

        setFiles((prevFiles) => {
            const newFiles = selectedFiles.filter(
                (selectedFile) =>
                    !prevFiles.some(
                        (file) =>
                            file.name === selectedFile.name &&
                            file.size === selectedFile.size
                    )
            );

            return [...prevFiles, ...newFiles];
        });

        e.target.value = '';
    };

    const handleRemoveFile = (index: number) => {
        setFiles((prevFiles) =>
            prevFiles.filter((_, i) => i !== index)
        );
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        onRegister({
            category,
            title,
            content,
            isImportant,
            isPinned,
            files,
        });
    };

    return (
        <div className="card mb-4">
            <div className="card-body">
                <h5 className="fw-bold mb-3">공지사항 등록</h5>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">공지 유형</label>

                        <select
                            className="form-select"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="이용안내">이용안내</option>
                            <option value="시설점검">시설점검</option>
                            <option value="주차요금">주차요금</option>
                            <option value="긴급공지">긴급공지</option>
                            <option value="정기권">정기권</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">제목</label>

                        <input
                            type="text"
                            className="form-control"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">내용</label>

                        <textarea
                            className="form-control"
                            rows={6}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="noticeImportant"
                                checked={isImportant}
                                onChange={(e) => setIsImportant(e.target.checked)}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="noticeImportant"
                            >
                                중요 공지
                            </label>
                        </div>

                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="noticePinned"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                            />
                            <label
                                className="form-check-label"
                                htmlFor="noticePinned"
                            >
                                상단 고정
                            </label>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">첨부파일</label>

                        <input
                            type="file"
                            className="form-control"
                            multiple
                            onChange={handleFileChange}
                        />

                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${file.size}-${index}`}
                                className="d-flex align-items-center gap-2 mt-2"
                            >
                                <span className="small">{file.name}</span>

                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveFile(index)}
                                >
                                    삭제
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={onCancel}
                        >
                            취소
                        </button>

                        <button type="submit" className="btn btn-primary">
                            등록
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}