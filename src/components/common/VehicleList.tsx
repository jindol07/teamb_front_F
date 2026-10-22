import { useState } from "react";
import { vehicleState } from "../../pages/user/login/UserSignUp";

export default function VehicleList({
    vehicles, setVehicles
}: vehicleState) {
    const [isModifyVehiclesInfo, setIsModifyVehiclesInfo] = useState<number | null>(null);
    const [isNewVehicle, setIsNewVehicle] = useState(false);
    const [modifyVehicle, setModifyVehicle] = useState({
        vehicle_number: "",
        owner_name: "",
        vehicle_type_code: "",
    })
    const [newVehicle, setNewVehicle] = useState({
        vehicle_number: "",
        owner_name: "",
        vehicle_type_code: "PERSONAL",
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
                            className="d-flex flex-column gap-3 p-3 border rounded"
                            key={i}
                        >
                            {/* 차량 정보 */}
                            <div className="flex-grow-1">
                                {isModifyVehiclesInfo == i ?
                                    <div className="d-flex flex-column gap-3">
                                        <div className="flex-fill">
                                            <label className="form-label">
                                                차량 번호
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="예: 12가 3456"
                                                value={modifyVehicle.vehicle_number}
                                                name="vehicle_number"
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
                                                value={modifyVehicle.owner_name}
                                                name="owner_name"
                                                onChange={f => {
                                                    setFormData(f);
                                                }}
                                            />
                                        </div>

                                        <div style={{ flex: "1 1", minWidth: 180 }}>
                                            <label htmlFor="vehicle_type" className="form-label">
                                                차량 구분
                                            </label>
                                            <select
                                                id="vehicle_type_code"
                                                name="vehicle_type_code"
                                                className="form-select"
                                                value={modifyVehicle.vehicle_type_code}
                                                onChange={f => {
                                                    setFormData(f);
                                                }}
                                            >
                                                <option value="PERSONAL">개인차량</option>
                                                <option value="OFFICE">법인차량</option>
                                            </select>
                                        </div>
                                    </div>
                                    :
                                    <div className="d-flex flex-column gap-2">
                                        <div>
                                            <span className="text-secondary me-2">
                                                차량 번호
                                            </span>
                                            <span className="fw-medium">
                                                {e.vehicle_number}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-secondary me-2">
                                                소유주
                                            </span>
                                            <span className="fw-medium">
                                                {e.owner_name}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-secondary me-2">
                                                차량 구분
                                            </span>
                                            <span className="fw-medium">
                                                {e.vehicle_type_code === "PERSONAL" ? "개인차량" : "법인차량"}
                                            </span>
                                        </div>
                                    </div>
                                }
                            </div>

                            {/* 차량별 버튼 */}
                            <div className="d-flex flex-row justify-content-end gap-2">
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
                                                        vehicle_number: modifyVehicle.vehicle_number,
                                                        owner_name: modifyVehicle.owner_name,
                                                        vehicle_type_code: modifyVehicle.vehicle_type_code
                                                    }
                                                }
                                                return f;
                                            }));
                                        } else {
                                            setIsModifyVehiclesInfo(i);
                                            setModifyVehicle({
                                                vehicle_number: e.vehicle_number,
                                                owner_name: e.owner_name,
                                                vehicle_type_code: e.vehicle_type_code,
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
                    <div className="d-flex flex-column gap-3">
                        <div className="flex-fill">
                            <label htmlFor="newvehicle_number" className="form-label">
                                차량 번호
                            </label>
                            <input
                                id="newvehicle_number"
                                type="text"
                                className="form-control"
                                placeholder="예: 12가 3456"
                                onChange={e => setNewVehicle({
                                    vehicle_number: e.target.value,
                                    owner_name: newVehicle.owner_name,
                                    vehicle_type_code: newVehicle.vehicle_type_code,
                                })}
                            />
                        </div>

                        <div className="flex-fill">
                            <label htmlFor="newVehicleowner_name" className="form-label">
                                소유주
                            </label>
                            <input
                                id="newVehicleowner_name"
                                type="text"
                                className="form-control"
                                placeholder="홍길동"
                                onChange={e => setNewVehicle({
                                    vehicle_number: newVehicle.vehicle_number,
                                    owner_name: e.target.value,
                                    vehicle_type_code: newVehicle.vehicle_type_code,
                                })}
                            />
                        </div>

                        <div className="flex-fill">
                            <label htmlFor="vehicle_type" className="form-label">
                                차량 구분
                            </label>
                            <select
                                id="vehicle_type_code"
                                name="vehicle_type_code"
                                className="form-select"
                                value={newVehicle.vehicle_type_code}
                                onChange={e => setNewVehicle({
                                    vehicle_number: newVehicle.vehicle_number,
                                    owner_name: newVehicle.owner_name,
                                    vehicle_type_code: e.target.value,
                                })}
                            >
                                <option value="PERSONAL">개인차량</option>
                                <option value="OFFICE">법인차량</option>
                            </select>
                        </div>

                        <div className="d-flex flex-row justify-content-end gap-2">
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
                    onClick={() => {
                        setIsNewVehicle(true);
                        setNewVehicle({
                            vehicle_number: "",
                            owner_name: "",
                            vehicle_type_code: "PERSONAL",
                        });
                    }}
                >
                    + 차량 추가
                </button>
            </div>
        </div>
    );
}