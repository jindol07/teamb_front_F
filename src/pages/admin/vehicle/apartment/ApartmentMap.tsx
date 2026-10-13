import { useState } from "react";
import { vehicleListMock } from "../../../../mock/vehicleMock";
import "./ApartmentMap.css";

type Vehicle = {
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  registeredAt: string;
};

type Unit = {
  no: number;
  vehicle: Vehicle | null;
};

type Floor = {
  floor: number;
  units: Unit[];
};

type Building = {
  id: number;
  x: number;
  y: number;
  floors: Floor[];
};

interface ApartmentMapProps {
  selectedBuilding?: string;
  selectedUnit?: string;
  onUnitSelect?: (
    building: string,
    unit: string,
  ) => void;
}

/**
 * 층 / 호수 생성
 */
const createFloors = (
  buildingId: number,
): Floor[] =>
  Array.from(
    { length: 10 },
    (_, floorIndex) => {
      const floor = floorIndex + 1;

      return {
        floor,
        units: Array.from(
          { length: 4 },
          (_, unitIndex) => {
            const no =
              floor * 100 +
              unitIndex +
              1;

            return {
              no,
              vehicle:
                vehicleListMock.find(
                  (vehicle) =>
                    String(
                      vehicle.building,
                    ) ===
                      String(
                        buildingId,
                      ) &&
                    String(
                      vehicle.unit,
                    ) === String(no),
                ) ?? null,
            };
          },
        ),
      };
    },
  );

/**
 * 상가 건물
 *
 * 나중에 건물이 여러 개가 되면
 * 이 배열에 추가하면 됩니다.
 */
const buildings: Building[] = [
  {
    id: 101,
    x: 50,
    y: 120,
    floors: createFloors(101),
  },
];

export default function ApartmentMap({
  selectedBuilding,
  selectedUnit,
  onUnitSelect,
}: ApartmentMapProps) {
  const [
    internalSelectedBuilding,
    setInternalSelectedBuilding,
  ] = useState<Building | null>(
    null,
  );

  const [
    selectedFloor,
    setSelectedFloor,
  ] = useState<Floor | null>(
    null,
  );

  const [
    internalSelectedUnit,
    setInternalSelectedUnit,
  ] = useState<Unit | null>(
    null,
  );

  const [
    hoveredUnit,
    setHoveredUnit,
  ] = useState<Unit | null>(
    null,
  );

  /**
   * 현재 선택된 동
   */
  const currentBuilding =
    internalSelectedBuilding ??
    (selectedBuilding
      ? buildings.find(
          (building) =>
            String(
              building.id,
            ) ===
            selectedBuilding,
        ) ?? null
      : null);

  /**
   * 현재 선택된 호수
   */
  const currentUnit =
    internalSelectedUnit ??
    (selectedUnit &&
    currentBuilding
      ? currentBuilding.floors
          .flatMap(
            (floor) =>
              floor.units,
          )
          .find(
            (unit) =>
              String(
                unit.no,
              ) ===
              selectedUnit,
          ) ?? null
      : null);

  /**
   * 현재 선택된 동의
   * 등록 차량 수
   */
  const registeredVehicleCount =
    currentBuilding
      ? currentBuilding.floors
          .flatMap(
            (floor) =>
              floor.units,
          )
          .filter(
            (unit) =>
              unit.vehicle !== null,
          ).length
      : 0;

  /**
   * 현재 선택된 동의
   * 전체 호수
   */
  const totalUnitCount =
    currentBuilding
      ? currentBuilding.floors.reduce(
          (total, floor) =>
            total +
            floor.units.length,
          0,
        )
      : 0;

  /**
   * 현재 선택된 동의
   * 미등록 호수
   */
  const emptyUnitCount =
    totalUnitCount -
    registeredVehicleCount;

  /**
   * 동 선택
   */
  const handleBuildingClick = (
    building: Building,
  ) => {
    setInternalSelectedBuilding(
      building,
    );

    setSelectedFloor(
      building.floors[0],
    );

    setInternalSelectedUnit(
      null,
    );

    setHoveredUnit(null);
  };

  /**
   * 층 선택
   */
  const handleFloorClick = (
    event: React.MouseEvent,
    building: Building,
    floor: Floor,
  ) => {
    event.stopPropagation();

    setInternalSelectedBuilding(
      building,
    );

    setSelectedFloor(floor);

    setInternalSelectedUnit(
      null,
    );

    setHoveredUnit(null);
  };

  /**
   * 호수 선택
   */
  const handleUnitClick = (
    unit: Unit,
  ) => {
    setInternalSelectedUnit(
      unit,
    );

    if (
      currentBuilding &&
      onUnitSelect
    ) {
      onUnitSelect(
        String(
          currentBuilding.id,
        ),
        String(unit.no),
      );
    }
  };

  /**
   * 상세 패널 닫기
   */
  const handleClosePanel = () => {
    setSelectedFloor(null);
    setInternalSelectedUnit(
      null,
    );
    setHoveredUnit(null);
  };

  return (
    <div className="apartment-container">
      {/* 헤더 */}
      <div className="apartment-header">
        <div>
          <h2>OO 상가 차량관리</h2>

          <p>
            상가 배치도에서 상가별
            차량 등록 현황을
            확인합니다.
          </p>
        </div>

        {currentBuilding && (
          <div className="breadcrumb">
            <span>OO 상가</span>

            <span>›</span>

            <strong>
              {currentBuilding.id}동
            </strong>

            {selectedFloor && (
              <>
                <span>›</span>

                <strong>
                  {selectedFloor.floor}
                  층
                </strong>
              </>
            )}

            {currentUnit && (
              <>
                <span>›</span>

                <strong>
                  {currentUnit.no}호
                </strong>
              </>
            )}
          </div>
        )}
      </div>

      <div className="map-wrapper">
                {/* =========================
            상가 배치도
        ========================= */}

        <svg
          viewBox="0 0 1000 700"
          className="apartment-map"
        >
          {/* 단지 배경 */}
          <rect
            x="0"
            y="0"
            width="1000"
            height="700"
            rx="24"
            className="complex-background"
          />

          {/* 도로 */}
          <path
            d="M 0 480 L 1000 480"
            className="road"
          />

          <path
            d="M 350 0 L 700 700"
            className="road"
          />

          {/* 공원 */}
          <rect
            x="30"
            y="550"
            width="550"
            height="140"
            rx="24"
            className="park"
          />

          <text
            x="305"
            y="628"
            textAnchor="middle"
            className="park-text"
          >
            00 한강 공원
          </text>

          {/* =========================
              상가 건물
          ========================= */}

          {buildings.map(
            (building) => {
              const isSelected =
                currentBuilding?.id ===
                building.id;

              return (
                <g
                  key={building.id}
                  className={`building ${
                    isSelected
                      ? "selected"
                      : ""
                  }`}
                  transform={`translate(${building.x}, ${building.y})`}
                  onMouseEnter={() => {
                    setInternalSelectedBuilding(
                      building,
                    );

                    setSelectedFloor(
                      null,
                    );

                    setInternalSelectedUnit(
                      null,
                    );

                    setHoveredUnit(
                      null,
                    );
                  }}
                  onClick={() =>
                    handleBuildingClick(
                      building,
                    )
                  }
                >
                  {/* 건물 그림자 */}
                  <rect
                    x="8"
                    y="8"
                    width="400"
                    height="310"
                    rx="12"
                    className="building-shadow"
                  />

                  {/* 건물 외벽 */}
                  <rect
                    x="0"
                    y="0"
                    width="400"
                    height="310"
                    rx="12"
                    className="building-body"
                  />

                  {/* 건물 상단 */}
                  <rect
                    x="0"
                    y="0"
                    width="400"
                    height="52"
                    rx="12"
                    className="building-roof"
                  />

                  {/* 상단 간판 */}
                  <rect
                    x="24"
                    y="12"
                    width="352"
                    height="28"
                    rx="6"
                    className="building-sign"
                  />

                  <text
                    x="200"
                    y="31"
                    textAnchor="middle"
                    className="building-sign-text"
                  >
                    OO 상가
                  </text>

                  {/* 층 */}
                  {building.floors.map(
                    (
                      floor,
                      index,
                    ) => {
                      const floorHeight =
                        24;

                      const floorY =
                        275 -
                        index *
                          floorHeight;

                      const isFloorSelected =
                        selectedFloor?.floor ===
                        floor.floor;

                      const floorRegistered =
                        floor.units.filter(
                          (unit) =>
                            unit.vehicle !==
                            null,
                        ).length;

                      return (
                        <g
                          key={
                            floor.floor
                          }
                          className={`floor ${
                            isFloorSelected
                              ? "selected"
                              : ""
                          }`}
                          transform={`translate(10, ${floorY})`}
                          onMouseEnter={(
                            e,
                          ) => {
                            e.stopPropagation();

                            setInternalSelectedBuilding(
                              building,
                            );

                            setSelectedFloor(
                              floor,
                            );

                            setInternalSelectedUnit(
                              null,
                            );

                            setHoveredUnit(
                              null,
                            );
                          }}
                          onClick={(
                            e,
                          ) =>
                            handleFloorClick(
                              e,
                              building,
                              floor,
                            )
                          }
                        >
                          {/* 층 배경 */}
                          <rect
                            x="0"
                            y="-20"
                            width="380"
                            height="20"
                            rx="4"
                            className="floor-background"
                          />

                          {/* 창문 */}
                          <rect
                            x="52"
                            y="-16"
                            width="34"
                            height="12"
                            rx="2"
                            className="floor-window"
                          />

                          <rect
                            x="96"
                            y="-16"
                            width="34"
                            height="12"
                            rx="2"
                            className="floor-window"
                          />

                          <rect
                            x="140"
                            y="-16"
                            width="34"
                            height="12"
                            rx="2"
                            className="floor-window"
                          />

                          <rect
                            x="184"
                            y="-16"
                            width="34"
                            height="12"
                            rx="2"
                            className="floor-window"
                          />

                          <rect
                            x="228"
                            y="-16"
                            width="34"
                            height="12"
                            rx="2"
                            className="floor-window"
                          />

                          <rect
                            x="272"
                            y="-16"
                            width="34"
                            height="12"
                            rx="2"
                            className="floor-window"
                          />

                          {/* 층 번호 */}
                          <text
                            x="20"
                            y="-6"
                            textAnchor="middle"
                            className="floor-number"
                          >
                            {
                              floor.floor
                            }
                            F
                          </text>

                          {/* 차량 등록 표시 */}
                          <circle
                            cx="350"
                            cy="-10"
                            r="5"
                            className={
                              floorRegistered >
                              0
                                ? "floor-status active"
                                : "floor-status"
                            }
                          />
                        </g>
                      );
                    },
                  )}

                  {/* 건물 하단 출입구 */}
                  <rect
                    x="150"
                    y="278"
                    width="100"
                    height="32"
                    rx="6"
                    className="building-entrance"
                  />

                  <rect
                    x="162"
                    y="286"
                    width="76"
                    height="24"
                    rx="3"
                    className="building-door"
                  />

                  <text
                    x="200"
                    y="303"
                    textAnchor="middle"
                    className="building-entrance-text"
                  >
                    MAIN
                  </text>

                  {/* 건물 번호 */}
                  <text
                    x="200"
                    y="-18"
                    textAnchor="middle"
                    className="building-label"
                  >
                    {building.id}동
                  </text>
                </g>
              );
            },
          )}
        </svg>

        {/* 현재 건물 정보 */}
        {currentBuilding && (
          <div className="building-info-card">
            <div className="building-info-title">
              <strong>
                {currentBuilding.id}동
              </strong>

              <span>
                차량 등록 현황
              </span>
            </div>

            <div className="building-info-stats">
              <div>
                <strong>
                  {registeredVehicleCount}
                </strong>

                <span>등록</span>
              </div>

              <div>
                <strong>
                  {emptyUnitCount}
                </strong>

                <span>미등록</span>
              </div>

              <div>
                <strong>
                  {totalUnitCount}
                </strong>

                <span>전체</span>
              </div>
            </div>
          </div>
        )}
        {/* =========================
            층 / 호수 차량 상세
        ========================= */}

        {currentBuilding &&
          selectedFloor && (
            <div className="floor-panel">
              {/* 패널 헤더 */}
              <div className="floor-panel-header">
                <div>
                  <div className="floor-title">
                    {
                      currentBuilding.id
                    }
                    동{" "}
                    {
                      selectedFloor.floor
                    }
                    층
                  </div>

                  <span>
                    상가 호수별 차량
                    등록 현황
                  </span>
                </div>

                <button
                  type="button"
                  className="panel-close"
                  aria-label="닫기"
                  onClick={
                    handleClosePanel
                  }
                >
                  ×
                </button>
              </div>

              {/* 호수 목록 */}
              <div className="units">
                {selectedFloor.units.map(
                  (unit) => {
                    const isRegistered =
                      unit.vehicle !==
                      null;

                    const isSelected =
                      currentUnit?.no ===
                      unit.no;

                    return (
                      <div
                        key={unit.no}
                        className={`unit ${
                          isRegistered
                            ? "registered"
                            : "empty"
                        } ${
                          isSelected
                            ? "selected"
                            : ""
                        }`}
                        onMouseEnter={() =>
                          setHoveredUnit(
                            unit,
                          )
                        }
                        onMouseLeave={() =>
                          setHoveredUnit(
                            null,
                          )
                        }
                        onClick={() =>
                          handleUnitClick(
                            unit,
                          )
                        }
                      >
                        <div className="unit-info">
                          <strong>
                            {unit.no}호
                          </strong>

                          <small
                            className={
                              isRegistered
                                ? "registered-text"
                                : "empty-text"
                            }
                          >
                            <i />

                            {isRegistered
                              ? "등록됨"
                              : "미등록"}
                          </small>
                        </div>

                        {isRegistered &&
                          unit.vehicle && (
                            <div className="unit-vehicle">
                              <span>
                                {
                                  unit
                                    .vehicle
                                    .vehicleNumber
                                }
                              </span>

                              <small>
                                {
                                  unit
                                    .vehicle
                                    .ownerName
                                }
                              </small>
                            </div>
                          )}

                        {hoveredUnit?.no ===
                          unit.no &&
                          isRegistered &&
                          unit.vehicle && (
                            <div className="unit-tooltip">
                              <strong>
                                {
                                  unit
                                    .vehicle
                                    .vehicleNumber
                                }
                              </strong>

                              <span>
                                {
                                  unit
                                    .vehicle
                                    .ownerName
                                }
                              </span>

                              <span>
                                {
                                  unit
                                    .vehicle
                                    .vehicleType
                                }
                              </span>
                            </div>
                          )}
                      </div>
                    );
                  },
                )}
              </div>

              {/* 선택된 호수 정보 */}
              {currentUnit && (
                <div className="selected-unit-detail">
                  <div>
                    <span>
                      선택 호수
                    </span>

                    <strong>
                      {
                        currentBuilding.id
                      }
                      동{" "}
                      {currentUnit.no}호
                    </strong>
                  </div>

                  {currentUnit.vehicle ? (
                    <div className="selected-vehicle">
                      <div>
                        <span>
                          차량번호
                        </span>

                        <strong>
                          {
                            currentUnit
                              .vehicle
                              .vehicleNumber
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          차주
                        </span>

                        <strong>
                          {
                            currentUnit
                              .vehicle
                              .ownerName
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          차종
                        </span>

                        <strong>
                          {
                            currentUnit
                              .vehicle
                              .vehicleType
                          }
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <p className="no-vehicle">
                      등록된 차량이
                      없습니다.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        {/* 범례 */}
        <div className="map-legend">
          <div>
            <i className="legend-dot registered" />
            <span>
              차량 등록
            </span>
          </div>

          <div>
            <i className="legend-dot empty" />
            <span>
              차량 미등록
            </span>
          </div>

          <div>
            <i className="legend-dot selected" />
            <span>
              선택됨
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}