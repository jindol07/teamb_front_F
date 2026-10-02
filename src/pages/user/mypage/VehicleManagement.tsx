// 차량 등록·수정·삭제
import { useState } from 'react';
interface Vehicle {
    id: number;
    carNumber: string;
    carModel: string;
}
export default function VehicleManagement() {
    // 등록된 차량 목록
    const [vehicles, setVehicles] = useState<Vehicle[]>([
        {
            id: 1,
            carNumber: '12가3456',
            carModel: '아반떼',
        },
    ]);
    // 차량 등록 입력값
    const [carNumber, setCarNumber] = useState('');
    const [carModel, setCarModel] = useState('');
    // 수정 중인 차량 ID
    const [editId, setEditId] = useState<number | null>(null);
    // 수정할 차량번호
    const [editCarNumber, setEditCarNumber] = useState('');
    // 수정할 차종
    const [editCarModel, setEditCarModel] = useState('');
    // 차량 등록
    const handleAdd = () => {
        // 입력값 확인
        if (!carNumber.trim() || !carModel.trim()) {
            alert('차량번호와 차종을 입력해주세요.');
            return;
        }
        // 차량번호 중복 확인
        const isDuplicate = vehicles.some(
            (vehicle) =>
                vehicle.carNumber === carNumber.trim()
        );
        if (isDuplicate) {
            alert('이미 등록된 차량번호입니다.');
            return;
        }
        //새로운 차량 생성
        const newVehicle: Vehicle = {
            id: Date.now(),
            carNumber: carNumber.trim(),
            carModel: carModel.trim(),
        };
        setVehicles([
            ...vehicles,
            newVehicle,
        ]);
        // 등록 후 입력창 초기화
        setCarNumber('');
        setCarModel('');
    };
    // 차량 수정 시작
    const handleEdit = (vehicle: Vehicle) => {
        setEditId(vehicle.id);
        setEditCarNumber(
            vehicle.carNumber
        );
        setEditCarModel(
            vehicle.carModel
        );
    };
    // 차량 수정 저장
    const handleUpdate = (id: number) => {
        // 입력값 확인
        if (
            !editCarNumber.trim() ||
            !editCarModel.trim()
        ) {
            alert('차량번호와 차종을 입력해주세요.');
            return;
        }
        // 차량번호 중복 확인
        const isDuplicate = vehicles.some(
            (vehicle) =>
                vehicle.id !== id &&
                vehicle.carNumber === editCarNumber.trim()
        );
        if (isDuplicate) {
            alert('이미 등록된 차량번호입니다.');
            return;
        }
        const updatedVehicles =
            vehicles.map((vehicle) => {
                if (vehicle.id === id) {
                    return {
                        ...vehicle,
                        carNumber: editCarNumber.trim(),
                        carModel: editCarModel.trim(),
                    };
                }
                return vehicle;
            });
        setVehicles(updatedVehicles);
        // 수정 모드 종료
        setEditId(null);
        setEditCarNumber('');
        setEditCarModel('');
    };
    // 차량 수정 취소
    const handleCancelEdit = () => {
        setEditId(null);
        setEditCarNumber('');
        setEditCarModel('');
    };
    // 차량 삭제
    const handleDelete = (id: number) => {
        // 차량은 최소 1대가 있어야 함
        if (vehicles.length === 1) {
            alert('최소 1대의 차량은 등록되어 있어야 합니다.');
            return;
        }
        const result =
            confirm('차량을 삭제하시겠습니까?');
        if (!result) {
            return;
        }
        const updatedVehicles =
            vehicles.filter(
                (vehicle) =>
                    vehicle.id !== id
            );
        setVehicles(updatedVehicles);
    };
    return (
        <div className="card p-4">
            <h4 className="mb-4">
                내 차량 관리
            </h4>
            {/* 차량 등록 */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <input
                        className="form-control"
                        placeholder="차량번호"
                        value={carNumber}
                        onChange={(e) =>
                            setCarNumber(e.target.value)
                        }
                    />
                </div>
                <div className="col-md-4">
                    <input
                        className="form-control"
                        placeholder="차종"
                        value={carModel}
                        onChange={(e) =>
                            setCarModel(e.target.value)
                        }
                    />
                </div>
                <div className="col-md-4">
                    <button
                        className="btn btn-primary"
                        onClick={handleAdd}
                    >
                        차량 등록
                    </button>
                </div>
            </div>
            {/* 등록 차량 목록 */}
            <table className="table">
                <thead>
                    <tr>
                        <th>차량번호</th>
                        <th>차종</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {vehicles.map((vehicle) => (
                        <tr key={vehicle.id}>
                            {/* 수정 중인 차량인지 확인 */}
                            {editId === vehicle.id ? (
                                <>
                                    <td>
                                        <input
                                            className="form-control"
                                            value={editCarNumber}
                                            onChange={(e) =>
                                                setEditCarNumber(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="form-control"
                                            value={editCarModel}
                                            onChange={(e) =>
                                                setEditCarModel(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-primary me-2"
                                            onClick={() =>
                                                handleUpdate(
                                                    vehicle.id
                                                )
                                            }
                                        >
                                            저장
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={handleCancelEdit}
                                        >
                                            취소
                                        </button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>
                                        {vehicle.carNumber}
                                    </td>
                                    <td>
                                        {vehicle.carModel}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={() =>
                                                handleEdit(vehicle)
                                            }
                                        >
                                            수정
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() =>
                                                handleDelete(
                                                    vehicle.id
                                                )
                                            }
                                        >
                                            삭제
                                        </button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}