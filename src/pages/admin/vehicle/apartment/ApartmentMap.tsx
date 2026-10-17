import { useState } from 'react';
import './ApartmentMap.css';
import { useVehicleStore } from '../vehicleStore';

type Vehicle = {
  id?: number;
  officeid?: number;
  vehicleNumber: string;
  vehicleType: string;
  vehicleModel?: string;
  building: string;
  officenumber: string | null;
  ownerName: string;
  registeredAt: string;
};

type OfficeSlot = {
  no: number;
  vehicle: Vehicle | null;
};

type Floor = {
  floor: number;
  units: OfficeSlot[];
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
  onUnitSelect?: (building: string, unit: string) => void;
}

/**
 * 건물 배치 정보
 * 차량 데이터는 Zustand 스토어에서 가져옵니다.
 */
const buildingLayouts = [
  {
    id: 101,
    x: 50,
    y: 120,
  },
];

/**
 * 층 / 호수 생성
 * 해당 건물과 호수에 등록된 차량을 연결합니다.
 */
const createFloors = (vehicles: Vehicle[]): Floor[] =>
  Array.from({ length: 10 }, (_, floorIndex) => {
    const floor = floorIndex + 1;

    return {
      floor,
      units: Array.from({ length: 4 }, (_, unitIndex) => {
        const no = floor * 100 + unitIndex + 1;

        const registeredVehicle = vehicles.find((vehicle) => {
          const vehicleOfficeNumber = String(vehicle.officenumber ?? '')
            .trim()
            .replace(/\s*호$/, '');

          return vehicleOfficeNumber === String(no);
        });

        return {
          no,
          vehicle: registeredVehicle ?? null,
        };
      }),
    };
  });

export default function ApartmentMap({
  selectedBuilding,
  selectedUnit,
  onUnitSelect,
}: ApartmentMapProps) {
  const vehicles = useVehicleStore((state) => state.vehicles);

  const [internalSelectedBuilding, setInternalSelectedBuilding] =
    useState<Building | null>(null);

  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);

  const [internalSelectedUnit, setInternalSelectedUnit] = useState<OfficeSlot | null>(
    null,
  );

  /**
   * 차량 목록 변경 시 건물과 층 데이터를 다시 구성합니다.
   */
  const buildings: Building[] = buildingLayouts.map((building) => ({
    ...building,
    floors: createFloors(
      vehicles.map((v) => ({
        ...v,
        officeid: v.officeid,
        vehicleNumber: v.vehiclenumber,
        vehicleType: v.vehicletypecode,
        ownerName: v.ownername,
        registeredAt: v.registeredat ?? '',
        building: v.building ?? '',
        officenumber: v.officenumber ?? null,
      })),
    ),
  }));
  /**
   * 현재 선택된 동
   */
  const currentBuilding =
    internalSelectedBuilding ??
    (selectedBuilding
      ? (buildings.find((building) => String(building.id) === selectedBuilding) ?? null)
      : null);

  /**
   * 현재 선택된 호수
   */
  const currentUnit: OfficeSlot | null =
    internalSelectedUnit ??
    (selectedUnit && currentBuilding
      ? (currentBuilding.floors
          .flatMap((floor) => floor.units)
          .find((officenumber) => String(officenumber.no) === selectedUnit) ?? null)
      : null);

  /**
   * 등록 차량 수
   */
  const registeredVehicleCount = currentBuilding
    ? currentBuilding.floors
        .flatMap((floor) => floor.units)
        .filter((unit) => unit.vehicle !== null).length
    : 0;

  /**
   * 전체 호수
   */
  const totalUnitCount = currentBuilding
    ? currentBuilding.floors.reduce((total, floor) => total + floor.units.length, 0)
    : 0;

  /**
   * 미등록 호수
   */
  const emptyUnitCount = totalUnitCount - registeredVehicleCount;

  /**
   * 동 선택
   */
  const handleBuildingClick = (building: Building) => {
    setInternalSelectedBuilding(building);
    setSelectedFloor(building.floors[0]);
    setInternalSelectedUnit(null);
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

    setInternalSelectedBuilding(building);
    setSelectedFloor(floor);
    setInternalSelectedUnit(null);
  };

  /**
   * 호수 선택
   */
  const handleUnitClick = (unit: OfficeSlot) => {
    setInternalSelectedUnit(unit);

    if (currentBuilding && onUnitSelect) {
      onUnitSelect(String(currentBuilding.id), String(unit.no));
    }
  };

  /**
   * 상세 패널 닫기
   */
  const handleClosePanel = () => {
    setSelectedFloor(null);
    setInternalSelectedUnit(null);
  };

  return (
    <div className="apartment-container">
      {/* 헤더 */}
      <div className="apartment-header">
        <div>
          <h2>OO 상가 차량관리</h2>
          <p>상가 배치도에서 상가별 차량 등록 현황을 확인합니다.</p>
        </div>

        {currentBuilding && (
          <div className="breadcrumb">
            <span>OO 상가</span>
            <span>›</span>
            <strong>{currentBuilding.id}동</strong>

            {selectedFloor && (
              <>
                <span>›</span>
                <strong>{selectedFloor.floor}층</strong>
              </>
            )}

            {currentUnit && (
              <>
                <span>›</span>
                <strong>{currentUnit.no}호</strong>
              </>
            )}
          </div>
        )}
      </div>

      <div className="map-wrapper">
        {/* 상가 배치도 */}
        <svg viewBox="0 0 1000 700" className="apartment-map">
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
          <path d="M 0 480 L 1000 480" className="road" />
          <path d="M 350 0 L 700 700" className="road" />
          {/* 한강 공원 */}
          <g className="park-area" transform="translate(10, -10)">
            {/* 공원 잔디 */}
            <rect x="30" y="550" width="550" height="140" rx="20" className="park" />

            {/* 잔디 구역 */}
            <path
              d="M 50 565 Q 150 550 245 570 T 430 565 L 560 575 L 560 675 L 50 675 Z"
              className="park-lawn"
            />

            {/* 산책로 */}
            <path
              d="M 45 625 C 130 595, 200 655, 290 620 S 440 595, 565 635"
              className="park-walkway"
            />

            {/* 산책로 안쪽 경계 */}
            <path
              d="M 45 625 C 130 595, 200 655, 290 620 S 440 595, 565 635"
              className="park-walkway-edge"
            />

            {/* 나무 */}
            <g className="park-trees">
              <circle cx="75" cy="575" r="12" className="park-tree-shadow" />
              <circle cx="72" cy="572" r="11" className="park-tree" />
              <circle cx="145" cy="665" r="13" className="park-tree-shadow" />
              <circle cx="142" cy="662" r="12" className="park-tree" />
              <circle cx="250" cy="570" r="12" className="park-tree-shadow" />
              <circle cx="247" cy="567" r="11" className="park-tree" />
              <circle cx="365" cy="665" r="13" className="park-tree-shadow" />
              <circle cx="362" cy="662" r="12" className="park-tree" />
              <circle cx="500" cy="575" r="12" className="park-tree-shadow" />
              <circle cx="497" cy="572" r="11" className="park-tree" />
              <circle cx="535" cy="665" r="12" className="park-tree-shadow" />
              <circle cx="532" cy="662" r="11" className="park-tree" />
            </g>

            {/* 벤치 */}
            <g className="park-benches">
              <rect x="180" y="580" width="30" height="7" rx="2" className="park-bench" />
              <line x1="185" y1="587" x2="185" y2="592" className="park-bench-leg" />
              <line x1="205" y1="587" x2="205" y2="592" className="park-bench-leg" />

              <rect x="420" y="645" width="30" height="7" rx="2" className="park-bench" />
              <line x1="425" y1="652" x2="425" y2="657" className="park-bench-leg" />
              <line x1="445" y1="652" x2="445" y2="657" className="park-bench-leg" />
            </g>

            {/* 공원 명칭 */}
            <text x="305" y="610" textAnchor="middle" className="park-text">
              00 한강 공원
            </text>
          </g>
          {/* 10/15 추가 */}
          {/* 카페 건물 및 야외 테라스 */}
          <g className="cafe-area" transform="translate(-80, -65)">
            {/* 카페 주변 바닥 */}
            <rect
              x="720"
              y="145"
              width="250"
              height="355"
              rx="18"
              className="cafe-site"
            />

            {/* 카페 건물 그림자 */}
            <rect
              x="747"
              y="174"
              width="200"
              height="142"
              rx="10"
              className="cafe-shadow"
            />

            {/* 카페 본체 */}
            <rect
              x="740"
              y="165"
              width="200"
              height="142"
              rx="10"
              className="cafe-building"
            />

            {/* 카페 지붕 */}
            <path d="M 730 180 L 840 145 L 950 180 Z" className="cafe-roof" />

            {/* 간판 */}
            <rect x="770" y="184" width="140" height="28" rx="5" className="cafe-sign" />
            <text x="840" y="203" textAnchor="middle" className="cafe-sign-text">
              CAFE
            </text>

            {/* 전면 통유리 */}
            <rect
              x="758"
              y="225"
              width="164"
              height="58"
              rx="4"
              className="cafe-window"
            />
            <line x1="812" y1="225" x2="812" y2="283" className="cafe-window-frame" />
            <line x1="868" y1="225" x2="868" y2="283" className="cafe-window-frame" />

            {/* 출입문 */}
            <rect x="824" y="245" width="32" height="62" rx="3" className="cafe-door" />
            <circle cx="849" cy="275" r="2" className="cafe-door-handle" />

            {/* 테라스 바닥 */}
            <rect
              x="735"
              y="330"
              width="220"
              height="145"
              rx="12"
              className="cafe-terrace"
            />

            {/* 테라스 테이블 1 */}
            <circle cx="780" cy="375" r="20" className="cafe-umbrella" />
            <circle cx="780" cy="375" r="5" className="cafe-umbrella-center" />
            <circle cx="754" cy="375" r="7" className="cafe-chair" />
            <circle cx="806" cy="375" r="7" className="cafe-chair" />

            {/* 테라스 테이블 2 */}
            <circle cx="875" cy="375" r="20" className="cafe-umbrella" />
            <circle cx="875" cy="375" r="5" className="cafe-umbrella-center" />
            <circle cx="849" cy="375" r="7" className="cafe-chair" />
            <circle cx="901" cy="375" r="7" className="cafe-chair" />

            {/* 테라스 테이블 3 */}
            <circle cx="827" cy="435" r="19" className="cafe-umbrella" />
            <circle cx="827" cy="435" r="5" className="cafe-umbrella-center" />
            <circle cx="802" cy="435" r="7" className="cafe-chair" />
            <circle cx="852" cy="435" r="7" className="cafe-chair" />

            {/* 화단 */}
            <rect
              x="930"
              y="330"
              width="18"
              height="145"
              rx="6"
              className="cafe-planter"
            />
            <circle cx="939" cy="350" r="8" className="cafe-tree" />
            <circle cx="939" cy="385" r="8" className="cafe-tree" />
            <circle cx="939" cy="420" r="8" className="cafe-tree" />
            <circle cx="939" cy="455" r="8" className="cafe-tree" />

            {/* 카페 명칭 */}
            <text x="840" y="490" textAnchor="middle" className="cafe-caption">
              OUTDOOR CAFE
            </text>
          </g>

          {/* 주유소 */}
          <g className="gas-station" transform="translate(15, -5)">
            {/* 주유소 부지 */}
            <rect x="720" y="490" width="250" height="195" rx="14" className="gas-site" />

            {/* 주유소 건물 */}
            <rect
              x="738"
              y="505"
              width="75"
              height="62"
              rx="6"
              className="gas-building"
            />

            <text x="775" y="530" textAnchor="middle" className="gas-building-title">
              GAS
            </text>

            <text x="775" y="546" textAnchor="middle" className="gas-building-subtitle">
              STATION
            </text>

            {/* 캐노피 지붕 */}
            <rect
              x="825"
              y="510"
              width="125"
              height="105"
              rx="6"
              className="gas-canopy-shadow"
            />

            <rect
              x="820"
              y="505"
              width="125"
              height="105"
              rx="6"
              className="gas-canopy"
            />

            {/* 캐노피 상단 포인트 */}
            <rect
              x="820"
              y="505"
              width="125"
              height="12"
              rx="3"
              className="gas-canopy-accent"
            />

            {/* 캐노피 기둥 */}
            <rect x="829" y="570" width="7" height="43" className="gas-column" />
            <rect x="929" y="570" width="7" height="43" className="gas-column" />

            {/* 주유기 1 */}
            <g transform="translate(842, 535)">
              <rect width="25" height="43" rx="4" className="gas-pump" />
              <rect
                x="4"
                y="5"
                width="17"
                height="10"
                rx="2"
                className="gas-pump-screen"
              />
              <rect
                x="5"
                y="20"
                width="15"
                height="15"
                rx="2"
                className="gas-pump-panel"
              />
              <path d="M 24 10 Q 34 12 30 28 L 26 31" className="gas-hose" />
            </g>

            {/* 주유기 2 */}
            <g transform="translate(890, 535)">
              <rect width="25" height="43" rx="4" className="gas-pump" />
              <rect
                x="4"
                y="5"
                width="17"
                height="10"
                rx="2"
                className="gas-pump-screen"
              />
              <rect
                x="5"
                y="20"
                width="15"
                height="15"
                rx="2"
                className="gas-pump-panel"
              />
              <path d="M 24 10 Q 34 12 30 28 L 26 31" className="gas-hose" />
            </g>

            {/* 진입 방향 표시 */}
            <path
              d="M 835 630 L 835 660 M 827 652 L 835 660 L 843 652"
              className="gas-direction"
            />

            <text x="895" y="654" textAnchor="middle" className="gas-label">
              GAS STATION
            </text>
          </g>
          {/* 상가 건물 */}
          {buildings.map((building) => {
            const isSelected = currentBuilding?.id === building.id;

            return (
              <g
                key={building.id}
                className={`building ${isSelected ? 'selected' : ''}`}
                transform={`translate(${building.x}, ${building.y})`}
                onClick={() => handleBuildingClick(building)}
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

                <text x="200" y="31" textAnchor="middle" className="building-sign-text">
                  OO 상가
                </text>

                {/* 층 */}
                {building.floors.map((floor, index) => {
                  const floorHeight = 24;
                  const floorY = 275 - index * floorHeight;

                  const isFloorSelected = selectedFloor?.floor === floor.floor;

                  const floorRegistered = floor.units.filter(
                    (unit) => unit.vehicle !== null,
                  ).length;

                  return (
                    <g
                      key={floor.floor}
                      className={`floor ${isFloorSelected ? 'selected' : ''}`}
                      transform={`translate(10, ${floorY})`}
                      onMouseEnter={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => handleFloorClick(event, building, floor)}
                    >
                      <rect
                        x="0"
                        y="-20"
                        width="380"
                        height="20"
                        rx="4"
                        className="floor-background"
                      />

                      {/* 창문 */}
                      {[52, 96, 140, 184, 228, 272].map((x) => (
                        <rect
                          key={x}
                          x={x}
                          y="-16"
                          width="34"
                          height="12"
                          rx="2"
                          className="floor-window"
                        />
                      ))}

                      {/* 층 번호 */}
                      <text x="20" y="-6" textAnchor="middle" className="floor-number">
                        {floor.floor}F
                      </text>

                      {/* 등록 차량 표시 */}
                      <circle
                        cx="350"
                        cy="-10"
                        r="5"
                        className={
                          floorRegistered > 0 ? 'floor-status active' : 'floor-status'
                        }
                      />
                    </g>
                  );
                })}

                {/* 출입구 */}
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
                <text x="200" y="-18" textAnchor="middle" className="building-label">
                  {building.id}동
                </text>
              </g>
            );
          })}
        </svg>

        {/* 현재 건물 정보 */}
        {currentBuilding && (
          <div className="building-info-card">
            <div className="building-info-title">
              <strong>{currentBuilding.id}동</strong>
              <span>차량 등록 현황</span>
            </div>

            <div className="building-info-stats">
              <div>
                <strong>{registeredVehicleCount}</strong>
                <span>등록</span>
              </div>

              <div>
                <strong>{emptyUnitCount}</strong>
                <span>미등록</span>
              </div>

              <div>
                <strong>{totalUnitCount}</strong>
                <span>전체</span>
              </div>
            </div>
          </div>
        )}

        {/* 층 / 호수 차량 상세 */}
        {currentBuilding && selectedFloor && (
          <div className="floor-panel">
            <div className="floor-panel-header">
              <div>
                <div className="floor-title">
                  {currentBuilding.id}동 {selectedFloor.floor}층
                </div>

                <span>상가 호수별 차량 등록 현황</span>
              </div>

              <button
                type="button"
                className="panel-close"
                aria-label="닫기"
                onClick={handleClosePanel}
              >
                ×
              </button>
            </div>

            {/* 호수 목록 */}
            <div className="officenumber">
              {selectedFloor.units.map((unit) => {
                const isRegistered = unit.vehicle !== null;
                const isSelected = currentUnit?.no === unit.no;

                return (
                  <div
                    key={unit.no}
                    className={`unit ${isRegistered ? 'registered' : 'empty'} ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => handleUnitClick(unit)}
                  >
                    <div className="unit-info">
                      <strong>{unit.no}호</strong>

                      <small className={isRegistered ? 'registered-text' : 'empty-text'}>
                        <i />
                        {isRegistered ? '등록됨' : '미등록'}
                      </small>
                    </div>

                    {isRegistered && unit.vehicle && (
                      <div className="unit-vehicle">
                        <span>{unit.vehicle.vehicleNumber}</span>
                        <small>{unit.vehicle.ownerName}</small>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 선택된 호수 정보 */}
            {currentUnit && (
              <div className="selected-unit-detail">
                <div>
                  <span>선택 호수</span>

                  <strong>
                    {currentBuilding.id}동 {currentUnit.no}호
                  </strong>
                </div>

                {currentUnit.vehicle ? (
                  <div className="selected-vehicle">
                    <div>
                      <span>차량번호</span>
                      <strong>{currentUnit.vehicle.vehicleNumber}</strong>
                    </div>

                    <div>
                      <span>차주</span>
                      <strong>{currentUnit.vehicle.ownerName}</strong>
                    </div>

                    <div>
                      <span>차종</span>
                      <strong>{currentUnit.vehicle.vehicleType}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="no-vehicle">등록된 차량이 없습니다.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 범례 */}
        <div className="map-legend">
          <div>
            <i className="legend-dot registered" />
            <span>차량 등록</span>
          </div>

          <div>
            <i className="legend-dot empty" />
            <span>차량 미등록</span>
          </div>

          <div>
            <i className="legend-dot selected" />
            <span>선택됨</span>
          </div>
        </div>
      </div>
    </div>
  );
}
