import { useState } from "react";
import { vehicleState } from "../../pages/user/login/UserSignUp";
import { checkVehicleNumber } from "../../auth/actions/authActions";

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
    const [vehicleError, setVehicleError] = useState("");

    function deleteCurrentVehicle(num : number): void {
        setVehicles(vehicles.filter((e, i) => {
            if (num === i) {
                return false;   
            }
            return true;
        }));
    }

    function setFormData(e : React.ChangeEvent<any>): void {
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

                            {isModifyVehiclesInfo === i && vehicleError && (
                                <div className="text-danger small mt-1">
                                    {vehicleError}
                                </div>
                            )}

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
                                    
                                    onClick={async () => {
                                        if (isModifyVehiclesInfo === i) {
                                            // 필수 입력값 검사
                                            if (!modifyVehicle.vehicle_number.trim()) {
                                                setVehicleError("차량 번호를 입력해주세요.");
                                                return;
                                            }

                                            if (!modifyVehicle.owner_name.trim()) {
                                                setVehicleError("소유주를 입력해주세요.");
                                                return;
                                            }

                                            // 차량 번호의 공백 제거
                                            const normalizedVehicleNumber =
                                                modifyVehicle.vehicle_number.replace(/\s/g, "");

                                            // 현재 수정 중인 차량을 제외하고 목록 내 중복 검사
                                            const isDuplicateInList = vehicles.some(
                                                (vehicle, index) =>
                                                    index !== i &&
                                                    vehicle.vehicle_number.replace(/\s/g, "") ===
                                                        normalizedVehicleNumber
                                            );

                                            if (isDuplicateInList) {
                                                setVehicleError("이미 입력한 차량 번호입니다.");
                                                return;
                                            }

                                            // 기존 차량 번호와 비교
                                            const originalVehicleNumber =
                                                vehicles[i].vehicle_number.replace(/\s/g, "");

                                            // 차량 번호가 변경된 경우에만 서버 중복 검사
                                            if (normalizedVehicleNumber !== originalVehicleNumber) {
                                                const result = await checkVehicleNumber(normalizedVehicleNumber);

                                                if (result === null) {
                                                    setVehicleError(
                                                        "차량 번호 중복 확인에 실패했습니다. 다시 시도해주세요."
                                                    );
                                                    return;
                                                }

                                                if (result) {
                                                    setVehicleError("이미 등록된 차량 번호입니다.");
                                                    return;
                                                }
                                            }

                                            // 검사를 모두 통과하면 수정 완료
                                            setVehicles(vehicles.map((vehicle, index) => {
                                                if (index === i) {
                                                    return {
                                                        vehicle_number: modifyVehicle.vehicle_number.trim(),
                                                        owner_name: modifyVehicle.owner_name.trim(),
                                                        vehicle_type_code: modifyVehicle.vehicle_type_code,
                                                    };
                                                }

                                                return vehicle;
                                            }));

                                            setVehicleError("");
                                            setIsModifyVehiclesInfo(null);
                                        } else {
                                            // 수정 모드 진입
                                            setVehicleError("");
                                            setIsModifyVehiclesInfo(i);
                                            setModifyVehicle({
                                                vehicle_number: e.vehicle_number,
                                                owner_name: e.owner_name,
                                                vehicle_type_code: e.vehicle_type_code,
                                            });
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
                                value={newVehicle.vehicle_number}
                                onChange={e => {
                                    setNewVehicle({
                                        vehicle_number: e.target.value,
                                        owner_name: newVehicle.owner_name,
                                        vehicle_type_code: newVehicle.vehicle_type_code,
                                    });
                                    setVehicleError("");
                                }}
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
                                value={newVehicle.owner_name}
                                onChange={e => {
                                    setNewVehicle({
                                        vehicle_number: newVehicle.vehicle_number,
                                        owner_name: e.target.value,
                                        vehicle_type_code: newVehicle.vehicle_type_code,
                                    });
                                    setVehicleError("");
                                }}
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
                        {vehicleError && (
                            <div className="text-danger small">
                                {vehicleError}
                            </div>
                        )}
                        <div className="d-flex flex-row justify-content-end gap-2">
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ minWidth: 80 }}
                                onClick={async () => {
                                    if (!newVehicle.vehicle_number.trim()) {
                                        setVehicleError("차량 번호를 입력해주세요.");
                                        return;
                                    }

                                    if (!newVehicle.owner_name.trim()) {
                                        setVehicleError("소유주를 입력해주세요.");
                                        return;
                                    }

                                    // 이미 입력한 차량 목록에서 중복 확인
                                    const normalizedVehicleNumber = newVehicle.vehicle_number
                                        .replace(/\s/g, "")
                                        .trim();

                                    const isDuplicateInList = vehicles.some(
                                        (vehicle) =>
                                            vehicle.vehicle_number.replace(/\s/g, "").trim() ===
                                            normalizedVehicleNumber
                                    );

                                    if (isDuplicateInList) {
                                        setVehicleError("이미 입력한 차량 번호입니다.");
                                        return;
                                    }

                                    // 서버에 차량 번호 중복 확인 요청
                                    const result = await checkVehicleNumber(normalizedVehicleNumber);

                                    if (result === null) {
                                        setVehicleError("차량 번호 중복 확인에 실패했습니다. 다시 시도해주세요.");
                                        return;
                                    }

                                    if (result) {
                                        setVehicleError("이미 등록된 차량 번호입니다.");
                                        return;
                                    }

                                    setVehicles([...vehicles, newVehicle]);
                                    setVehicleError("");
                                    setIsNewVehicle(false);
                                }}
                            >
                                확인
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                style={{ minWidth: 80 }}
                                onClick={() => {
                                    setIsNewVehicle(false);
                                    setVehicleError("");
                                }}
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