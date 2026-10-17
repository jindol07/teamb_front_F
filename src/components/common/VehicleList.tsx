import { useState } from "react";

// import './VehicleList.css';

interface Vehicles {
    vehicleNumber: string,
    ornerName: string,
}

const vehiclesData = [
    {
        vehicleNumber: '43가 3645',
        ownerName: '김만치',
    },
]

export default function VehicleList() {
    const [vehicles, setVehicles] = useState(vehiclesData);
    const [isModifyVehiclesInfo, setIsModifyVehiclesInfo] = useState<number | null>(null);
    const [isNewVehicle, setIsNewVehicle] = useState(false);
    const [modifyVehicle, setModifyVehicle] = useState({
        vehicleNumber: "",
        ownerName: "",
    })
    const [newVehicle, setNewVehicle] = useState({
        vehicleNumber: "",
        ownerName: "",
    })

    function deleteCurrentVehicle(num : number): void {
        setVehicles(vehicles.filter((e, i) => {
            if (num === i) {
                return false;
            }
            return true;
        }));
    }

    function setFormData(e : React.ChangeEvent<any>): void {
        console.log(e.target.name);
        setModifyVehicle({
            ...modifyVehicle,
            [e.target.name]: e.target.value,
        })
    }

    return (
        <div className="d-flex flex-column gap-2">

            {/* 등록된 차량 목록 */}
            <div className="d-flex flex-column gap-2">
                {vehicles.length ?
                    vehicles.map((e, i) => (
                        <div
                            className="d-flex align-items-start gap-3 p-3 border rounded"
                            key={i}
                        >
                            {/* 차량 정보 */}
                            <div className="flex-grow-1">
                                {isModifyVehiclesInfo == i ?
                                    <div className="d-flex flex-column flex-md-row gap-3">
                                        <div className="flex-fill">
                                            <label className="form-label">
                                                차량 번호
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="예: 12가 3456"
                                                value={modifyVehicle.vehicleNumber}
                                                name="vehicleNumber"
                                                onChange={f => {
                                                    setFormData(f);
                                                }}
                                            />
                                        </div>

                                        <div className="flex-fill">
                                            <label className="form-label">
                                                소유주
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="홍길동"
                                                value={modifyVehicle.ownerName}
                                                name="ownerName"
                                                onChange={f => {
                                                    setFormData(f);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    :
                                    <div className="d-flex flex-column gap-2">
                                        <div>
                                            <span className="text-secondary me-2">
                                                차량 번호
                                            </span>
                                            <span className="fw-medium">
                                                {e.vehicleNumber}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-secondary me-2">
                                                소유주
                                            </span>
                                            <span className="fw-medium">
                                                {e.ownerName}
                                            </span>
                                        </div>
                                    </div>
                                }
                            </div>

                            {/* 차량별 버튼 */}
                            <div className="d-flex flex-column flex-sm-row gap-2">
                                <button
                                    type="button"
                                    className={
                                        isModifyVehiclesInfo == i
                                            ? "btn btn-primary"
                                            : "btn btn-outline-primary"
                                    }
                                    style={{ minWidth: 80 }}
                                    onClick={() => {
                                        if (isModifyVehiclesInfo == i) {
                                            setIsModifyVehiclesInfo(null);
                                            setVehicles(vehicles.map((f, j) => {
                                                if (i === j) {
                                                    return {
                                                        vehicleNumber: modifyVehicle.vehicleNumber,
                                                        ownerName: modifyVehicle.ownerName
                                                    }
                                                }
                                                return f;
                                            }));
                                        } else {
                                            setIsModifyVehiclesInfo(i);
                                            setModifyVehicle({
                                                vehicleNumber: e.vehicleNumber,
                                                ownerName: e.ownerName,
                                            })
                                        }
                                    }}
                                >
                                    {isModifyVehiclesInfo == i ? "확인" : "수정"}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    style={{ minWidth: 80 }}
                                    onClick={() => isModifyVehiclesInfo ? setIsModifyVehiclesInfo(null) : deleteCurrentVehicle(i)}
                                >
                                    {isModifyVehiclesInfo == i ? "취소" : "삭제"}
                                </button>
                            </div>
                        </div>
                    ))
                    :
                    <div className="text-center text-secondary border rounded p-4">
                        등록된 차량이 없습니다.
                    </div>
                }
            </div>

            {/* 신규 차량 입력 영역 */}
            {isNewVehicle && (
                <div className="p-3 border rounded">
                    <div className="d-flex flex-column flex-md-row align-items-md-end gap-3">
                        <div className="flex-fill">
                            <label htmlFor="newVehicleNumber" className="form-label">
                                차량 번호
                            </label>
                            <input
                                id="newVehicleNumber"
                                type="text"
                                className="form-control"
                                placeholder="예: 12가 3456"
                                onChange={e => setNewVehicle({
                                    vehicleNumber: e.target.value,
                                    ownerName: newVehicle.ownerName,
                                })}
                            />
                        </div>

                        <div className="flex-fill">
                            <label htmlFor="newVehicleOwnerName" className="form-label">
                                소유주
                            </label>
                            <input
                                id="newVehicleOwnerName"
                                type="text"
                                className="form-control"
                                placeholder="홍길동"
                                onChange={e => setNewVehicle({
                                    vehicleNumber: newVehicle.vehicleNumber,
                                    ownerName: e.target.value,
                                })}
                            />
                        </div>

                        <div className="d-flex gap-2">
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ minWidth: 80 }}
                                onClick={() => {
                                    setVehicles([...vehicles, newVehicle])
                                    setIsNewVehicle(false);
                                }}
                            >
                                확인
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                style={{ minWidth: 80 }}
                                onClick={() => setIsNewVehicle(false)}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 차량 추가 버튼 */}
            <div className="d-flex justify-content-start">
                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setIsNewVehicle(true)}
                >
                    + 차량 추가
                </button>
            </div>
        </div>
    );
}