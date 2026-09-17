import { useState } from "react";
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
 * 테스트용 차량 데이터
 *
 * key 규칙
 * 10101 = 101동 101호
 * 10103 = 101동 103호
 * 10202 = 102동 102호
 * 10204 = 102동 104호
 * 10301 = 103동 101호
 */
const vehicleMock: Record<string, Vehicle> = {
  "101-101": {
    vehicleNumber: "12가 3456",
    vehicleType: "현대 아반떼",
    ownerName: "김민수",
    registeredAt: "2026-08-10",
  },

  "101-103": {
    vehicleNumber: "34나 5678",
    vehicleType: "기아 쏘렌토",
    ownerName: "이서연",
    registeredAt: "2026-08-15",
  },

  "102-102": {
    vehicleNumber: "56다 7890",
    vehicleType: "테슬라 Model 3",
    ownerName: "박지훈",
    registeredAt: "2026-08-20",
  },

  "102-104": {
    vehicleNumber: "78라 1234",
    vehicleType: "현대 그랜저",
    ownerName: "최유진",
    registeredAt: "2026-08-22",
  },

  "103-101": {
    vehicleNumber: "90마 4567",
    vehicleType: "기아 카니발",
    ownerName: "정우성",
    registeredAt: "2026-08-25",
  },
};

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

            const unitKey =
              `${buildingId}-${no}`;

            return {
              no,
              vehicle:
                vehicleMock[unitKey] ?? null,
            };
          },
        ),
      };
    },
  );

/**
 * 아파트 동
 */
const buildings: Building[] = [
  {
    id: 101,
    x: 70,
    y: 120,
    floors: createFloors(101),
  },

  {
    id: 102,
    x: 250,
    y: 100,
    floors: createFloors(102),
  },

  {
    id: 103,
    x: 600,
    y: 150,
    floors: createFloors(103),
  },
  {
    id: 104,
    x: 800,
    y: 130,
    floors: createFloors(104),
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
  ] = useState<Building | null>(null);

  const [
    selectedFloor,
    setSelectedFloor,
  ] = useState<Floor | null>(null);

  const [
    internalSelectedUnit,
    setInternalSelectedUnit,
  ] = useState<Unit | null>(null);

  const [
    hoveredUnit,
    setHoveredUnit,
  ] = useState<Unit | null>(null);

  /**
   * 현재 선택된 동
   */
  const currentBuilding =
    internalSelectedBuilding ??
    (selectedBuilding
      ? buildings.find(
        (building) =>
          String(building.id) ===
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
          (floor) => floor.units,
        )
        .find(
          (unit) =>
            String(unit.no) ===
            selectedUnit,
        ) ?? null
      : null);


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

    setInternalSelectedUnit(null);
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

    setInternalSelectedUnit(null);
    setHoveredUnit(null);
  };

  /**
   * 호수 선택
   */
  const handleUnitClick = (
    unit: Unit,
  ) => {
    setInternalSelectedUnit(unit);

    if (
      currentBuilding &&
      onUnitSelect
    ) {
      onUnitSelect(
        String(currentBuilding.id),
        String(unit.no),
      );
    }
  };

  /**
   * 상세 패널 닫기
   */
  const handleClosePanel = () => {
    setSelectedFloor(null);
    setInternalSelectedUnit(null);
    setHoveredUnit(null);
  };

  return (
    <div className="apartment-container">
      {/* =========================
          헤더
      ========================= */}

      <div className="apartment-header">
        <div>
          <h2>OO 아파트 차량관리</h2>

          <p>
            단지 배치도에서 세대별 차량 등록
            현황을 확인합니다.
          </p>
        </div>

        {currentBuilding && (
          <div className="breadcrumb">
            <span>OO 아파트</span>

            <span>›</span>

            <strong>
              {currentBuilding.id}동
            </strong>

            {selectedFloor && (
              <>
                <span>›</span>

                <strong>
                  {selectedFloor.floor}층
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
            아파트 배치도
        ========================= */}

        <svg
          viewBox="0 0 1000 600"
          className="apartment-map"
        >
          {/* 단지 배경 */}

          <rect
            x="0"
            y="0"
            width="1000"
            height="600"
            rx="20"
            className="complex-background"
          />

          {/* 도로 */}

          <path
            d="M 0 480 L 1000 480"
            className="road"
          />

          <path
            d="M 500 0 L 500 600"
            className="road"
          />

          {/* 공원 */}

          <rect
            x="30"
            y="550"
            width="400"
            height="100"
            rx="20"
            className="park"
          />

          <text
            x="240"
            y="600"
            textAnchor="middle"
            className="park-text"
          >
            중앙공원
          </text>

          {/* =========================
              아파트 동
          ========================= */}

          {buildings.map(
            (building) => (
              <g
                key={building.id}
                className={`building ${currentBuilding?.id ===
                  building.id
                  ? "selected"
                  : ""
                  }`}
                transform={`translate(${building.x}, ${building.y})`}
                onMouseEnter={() => {
                  setInternalSelectedBuilding(
                    building,
                  );

                  setSelectedFloor(null);
                  setInternalSelectedUnit(
                    null,
                  );

                  setHoveredUnit(null);
                }}
                onClick={() =>
                  handleBuildingClick(
                    building,
                  )
                }
              >
                {/* 건물 */}

                <rect
                  x="0"
                  y="0"
                  width="120"
                  height="270"
                  rx="8"
                  className="building-body"
                />

                {/* 층 */}

                {building.floors.map(
                  (
                    floor,
                    index,
                  ) => {
                    const floorHeight =
                      24;

                    return (
                      <g
                        key={
                          floor.floor
                        }
                        className="floor"
                        transform={`translate(10, ${245 -
                          index *
                          floorHeight
                          })`}
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
                        onClick={(e) =>
                          handleFloorClick(
                            e,
                            building,
                            floor,
                          )
                        }
                      >
                        <rect
                          x="0"
                          y="0"
                          width="100"
                          height="20"
                          rx="2"
                        />

                        <text
                          x="50"
                          y="14"
                          textAnchor="middle"
                        >
                          {
                            floor.floor
                          }
                          F
                        </text>
                      </g>
                    );
                  },
                )}

                {/* 동 번호 */}

                <text
                  x="60"
                  y="-15"
                  textAnchor="middle"
                  className="building-label"
                >
                  {building.id}동
                </text>
              </g>
            ),
          )}
        </svg>

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
                    {currentBuilding.id}동{" "}
                    {selectedFloor.floor}층
                  </div>

                  <span>
                    세대별 차량 등록 현황
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

              {/* =========================
                  호수 목록
              ========================= */}

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
                        className={`unit ${isRegistered
                          ? "registered"
                          : "empty"
                          } ${isSelected
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

                        {/* 호버 툴팁 */}

                        {hoveredUnit?.no ===
                          unit.no && (
                            <div className="unit-tooltip">
                              <strong>
                                {unit.no}호
                              </strong>

                              {unit.vehicle ? (
                                <>
                                  <span>
                                    🚗{" "}
                                    {
                                      unit
                                        .vehicle
                                        .vehicleNumber
                                    }
                                  </span>

                                  <span>
                                    {
                                      unit
                                        .vehicle
                                        .vehicleType
                                    }
                                  </span>

                                  <span>
                                    차주:{" "}
                                    {
                                      unit
                                        .vehicle
                                        .ownerName
                                    }
                                  </span>
                                </>
                              ) : (
                                <span>
                                  등록된 차량이
                                  없습니다.
                                </span>
                              )}
                            </div>
                          )}
                      </div>
                    );
                  },
                )}
              </div>

              {/* =========================
                  선택한 호수 차량 상세
              ========================= */}

              {currentUnit && (
                <div className="vehicle-detail">
                  <div className="vehicle-detail-header">
                    <div>
                      <div className="vehicle-location">
                        {currentBuilding.id}동 ·{" "}
                        {currentUnit.no}호
                      </div>

                      <h3>
                        차량 등록 정보
                      </h3>
                    </div>

                    <span
                      className={
                        currentUnit.vehicle
                          ? "vehicle-status registered"
                          : "vehicle-status empty"
                      }
                    >
                      {currentUnit.vehicle
                        ? "등록됨"
                        : "미등록"}
                    </span>
                  </div>

                  {currentUnit.vehicle ? (
                    <div className="vehicle-info">
                      {/* 차량번호 */}

                      <div className="vehicle-info-row">
                        <span className="vehicle-label">
                          차량번호
                        </span>

                        <strong className="vehicle-value vehicle-number">
                          {
                            currentUnit
                              .vehicle
                              .vehicleNumber
                          }
                        </strong>
                      </div>

                      {/* 차종 */}

                      <div className="vehicle-info-row">
                        <span className="vehicle-label">
                          차종
                        </span>

                        <strong className="vehicle-value">
                          {
                            currentUnit
                              .vehicle
                              .vehicleType
                          }
                        </strong>
                      </div>

                      {/* 차주 */}

                      <div className="vehicle-info-row">
                        <span className="vehicle-label">
                          차주
                        </span>

                        <strong className="vehicle-value">
                          {
                            currentUnit
                              .vehicle
                              .ownerName
                          }
                        </strong>
                      </div>

                      {/* 등록일 */}

                      <div className="vehicle-info-row">
                        <span className="vehicle-label">
                          등록일
                        </span>

                        <strong className="vehicle-value">
                          {
                            currentUnit
                              .vehicle
                              .registeredAt
                          }
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-vehicle">
                      <div className="empty-icon">
                        🚘
                      </div>

                      <strong>
                        등록된 차량이 없습니다.
                      </strong>

                      <span>
                        해당 세대에 등록된 차량
                        정보가 없습니다.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
      </div>

      {/* =========================
          범례
      ========================= */}

      <div className="legend">
        <div>
          <i className="registered" />
          차량 등록
        </div>

        <div>
          <i className="empty" />
          차량 미등록
        </div>
      </div>
    </div>
  );
}