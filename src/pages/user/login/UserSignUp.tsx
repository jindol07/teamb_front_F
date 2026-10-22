import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VehicleList from '../../../components/common/VehicleList';
import { checkUsername, officeSignup, signupData, Vehicle } from '../../../auth/actions/authActions';

/**
 * 입주민 회원가입 페이지 (/user/signup)
 */

export interface vehicleState {
    vehicles: Vehicle[],
    setVehicles: (vehicles: Vehicle[]) => void,
}

export default function UserSignUp() {
    const [isCheckbox1, setIsCheckbox1] = useState(false);
    const [isCheckbox2, setIsCheckbox2] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [username, setUsername] = useState<string>("");
    const [checkedUsername, setCheckedUsername] = useState<string>("");
    const [isAvailableUsername, setIsAvailableUsername] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const navigate = useNavigate();

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!validation()) {
            return;
        }

        const formData = new FormData(event.currentTarget);
        console.log(event.currentTarget);
        console.log(formData.get("username"));

        const signupData: signupData = {
            username: String(formData.get("username") ?? ""),
            password: String(formData.get("password") ?? ""),
            password_confirm: String(formData.get("password_confirm") ?? ""),
            email: String(formData.get("email") ?? ""),
            email_code: String(formData.get("email_code") ?? ""),
            phone: String(formData.get("phone") ?? ""),
            company_id: Number(formData.get("company_id") ?? ""),
            floor_no: Number(formData.get("floor_no") ?? ""),
            office_number: String(formData.get("office_number") ?? ""),
            verification_code: String(formData.get("verification_code") ?? ""),

            vehicle_list: vehicles,

            company_company_name: String(formData.get("company_company_name") ?? ""),
            company_business_number: String(formData.get("company_business_number") ?? ""),
            company_company_addr: String(formData.get("company_company_addr") ?? ""),
        };  

        console.log(signupData);

        const fetchOffice = async () => {
            const result = await officeSignup(signupData);
            console.log(result);
            if (result) {
                setUserInfo(result.data);
                alert("가입이 정상적으로 완료되었습니다.")
            }
        };
        fetchOffice();
        navigate('/user/login');
    };

    const userNameCheck = async () => {
        const isCheck = await checkUsername(username)
        console.log(username, isCheck);
        if (username != null) {
            if (!isCheck) {
                setCheckedUsername(username);
                setIsAvailableUsername(true);
                setValidationErrors(prev => ({ ...prev, username: "" }));
            } else {
                setIsAvailableUsername(false);
                setValidationErrors(prev => ({ ...prev, username: "이미 사용 중인 아이디입니다." }));
            }
        } else {
            console.log("오류");
        }
    }

    const validation = (): boolean => {
        const form = document.querySelector("form");

        if (!form) {
            return false;
        }

        const formData = new FormData(form);
        const errors: Record<string, string> = {};

        const password = String(formData.get("password") ?? "");
        const passwordConfirm = String(formData.get("password_confirm") ?? "");
        const email = String(formData.get("email") ?? "").trim();
        const emailCode = String(formData.get("email_code") ?? "").trim();
        const phone = String(formData.get("phone") ?? "").trim();
        const companyName = String(formData.get("company_company_name") ?? "").trim();
        const businessNumber = String(formData.get("company_business_number") ?? "").trim();
        const companyAddr = String(formData.get("company_company_addr") ?? "").trim();
        const floorNo = String(formData.get("floor_no") ?? "").trim();
        const officeNumber = String(formData.get("office_number") ?? "").trim();
        const verificationCode = String(formData.get("verification_code") ?? "").trim();

        if (!username.trim()) {
            errors.username = "아이디를 입력해주세요.";
        } else if (username.trim().length < 4 || username.trim().length > 20) {
            errors.username = "아이디는 4~20자로 입력해주세요.";
        } else if (!isAvailableUsername || checkedUsername !== username) {
            errors.username = "아이디 중복 확인을 해주세요.";
        }

        if (!password.trim()) {
            errors.password = "비밀번호를 입력해주세요.";
        } else if (password.length < 8 || password.length > 20) {
            errors.password = "비밀번호는 8~20자로 입력해주세요.";
        }

        if (!passwordConfirm.trim()) {
            errors.password_confirm = "비밀번호 확인을 입력해주세요.";
        } else if (password !== passwordConfirm) {
            errors.password_confirm = "비밀번호가 일치하지 않습니다.";
        }

        if (!email) {
            errors.email = "이메일을 입력해주세요.";
        } else if (email.length > 30) {
            errors.email = "이메일은 최대 30자까지 입력할 수 있습니다.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "올바른 이메일 형식으로 입력해주세요.";
        }

        if (!emailCode) {
            errors.email_code = "이메일 인증번호를 입력해주세요.";
        }

        if (!phone) {
            errors.phone = "휴대폰 번호를 입력해주세요.";
        } else if (
            !/^[0-9-]+$/.test(phone) ||
            !/^01[016789]\d{7,8}$/.test(phone.replace(/-/g, ""))
        ) {
            errors.phone = "올바른 휴대폰 번호를 입력해주세요.";
        }

        if (!companyName) {
            errors.company_company_name = "회사명을 입력해주세요.";
        } else if (companyName.length > 20) {
            errors.company_company_name = "회사명은 최대 20자까지 입력할 수 있습니다.";
        }

        const businessNumberValue = businessNumber.replace(/-/g, "");

        if (!businessNumber) {
            errors.company_business_number = "사업자 등록번호를 입력해주세요.";
        } else if (!/^\d{10}$/.test(businessNumberValue)) {
            errors.company_business_number = "사업자 등록번호는 숫자 10자리로 입력해주세요.";
        }

        if (!companyAddr) {
            errors.company_company_addr = "회사 주소를 입력해주세요.";
        } else if (companyAddr.length > 50) {
            errors.company_company_addr = "회사 주소는 최대 50자까지 입력할 수 있습니다.";
        }

        if (!floorNo) {
            errors.floor_no = "층수를 입력해주세요.";
        } else if (!/^\d+$/.test(floorNo)) {
            errors.floor_no = "층수는 숫자로 입력해주세요.";
        }

        if (!officeNumber) {
            errors.office_number = "호수를 입력해주세요.";
        } else if (!/^\d+$/.test(officeNumber)) {
            errors.office_number = "호수는 숫자로 입력해주세요.";
        }

        if (!verificationCode) {
            errors.verification_code = "입주민 인증번호를 입력해주세요.";
        }

        if (vehicles.length === 0) {
            errors.vehicle_list = "이용할 차량을 최소 1대 등록해주세요.";
        } else if (
            vehicles.some(vehicle =>
                !vehicle.vehicle_number.trim() ||
                !vehicle.owner_name.trim() ||
                !vehicle.vehicle_type_code
            )
        ) {
            errors.vehicle_list = "차량 번호, 소유주, 차량 구분을 모두 입력해주세요.";
        } else if (
            vehicles.some(vehicle => vehicle.vehicle_number.trim().length > 20)
        ) {
            errors.vehicle_list = "차량 번호는 최대 20자까지 입력할 수 있습니다.";
        } else if (
            vehicles.some(vehicle => vehicle.owner_name.trim().length > 20)
        ) {
            errors.vehicle_list = "차량 소유주는 최대 20자까지 입력할 수 있습니다.";
        }

        if (!isCheckbox1) {
            errors.terms = "이용약관에 동의해주세요.";
        }

        if (!isCheckbox2) {
            errors.privacy = "개인정보 수집 및 이용에 동의해주세요.";
        }

        setValidationErrors(errors);

        return Object.keys(errors).length === 0;
    }

    return (
        <div className="container d-flex justify-content-center py-5">
            <div className="w-100" style={{ maxWidth: 500 }}>

                {/* 제목 */}
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary">주차관제 서비스</h2>
                    <p className="text-secondary">입주민 회원가입</p>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* 아이디 */}
                    <div className="mb-3">
                        <label htmlFor="userId" className="form-label">
                            아이디
                        </label>
                        <div className="input-group">
                            <input
                                type="text"
                                id="username"
                                name="username"
                                className={`form-control ${validationErrors.username ? "is-invalid" : ""}`}
                                placeholder="아이디를 입력해주세요"
                                value={username}
                                onChange={ (e) => { setIsAvailableUsername
                                    setUsername(e.target.value)
                                    setIsAvailableUsername(false);
                                    setValidationErrors(prev => ({ ...prev, username: "" }));
                                } }
                            />
                            <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={ userNameCheck }
                            >
                                중복 확인
                            </button>
                        </div>
                        {validationErrors.username && (
                            <div className="text-danger small mt-1">
                                {validationErrors.username}
                            </div>
                        )}
                        
                        {!validationErrors.username && isAvailableUsername && (
                            <div className="text-success small mt-1">
                                사용할 수 있는 아이디입니다.
                            </div>
                        )}
                        
                        
                        


                    </div>
                    {/* 비밀번호 */}
                    <div className="mb-3">
                        <label htmlFor="userPw" className="form-label">
                            비밀번호
                        </label>

                        <input
                            type="password"
                            id="password"
                            name="password"
                            className={`form-control ${validationErrors.password ? "is-invalid" : ""}`}
                            placeholder="비밀번호를 입력해주세요"
                            onChange={() => setValidationErrors(prev => ({ ...prev, password: "" }))}
                        />
                        {validationErrors.password && (
                            <div className="text-danger small mt-1">
                                {validationErrors.password}
                            </div>
                        )}
                    </div>
                    {/* 비밀번호 확인 */}
                    <div className="mb-3">
                        <label htmlFor="userPwConfirm" className="form-label">
                            비밀번호 확인
                        </label>
                        <input
                            type="password"
                            id="password_confirm"
                            name="password_confirm"
                            className={`form-control ${validationErrors.password_confirm ? "is-invalid" : ""}`}
                            placeholder="비밀번호를 다시 입력해주세요"
                            onChange={() => setValidationErrors(prev => ({ ...prev, password_confirm: "" }))}
                        />
                        {validationErrors.password_confirm && (
                            <div className="text-danger small mt-1">
                                {validationErrors.password_confirm}
                            </div>
                        )}
                    </div>
                    {/* 이메일 */}
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                            이메일
                        </label>
                        <div className="input-group">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={`form-control ${validationErrors.email ? "is-invalid" : ""}`}
                                placeholder="이메일을 입력해주세요"
                                maxLength={30}
                                onChange={() => setValidationErrors(prev => ({ ...prev, email: "" }))}
                            />
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                            >
                                인증번호 발송
                            </button>
                        </div>
                        {validationErrors.email && (
                            <div className="text-danger small mt-1">
                                {validationErrors.email}
                            </div>
                        )}
                    </div>
                    {/* 이메일 인증번호 */}
                    <div className="mb-3">
                        <label htmlFor="emailCode" className="form-label">
                            인증번호
                        </label>
                        <input
                            type="text"
                            id="email_code"
                            name="email_code"
                            className={`form-control ${validationErrors.email_code ? "is-invalid" : ""}`}
                            placeholder="이메일로 받은 인증번호를 입력해주세요"
                            onChange={() => setValidationErrors(prev => ({ ...prev, email_code: "" }))}
                        />
                        {validationErrors.email_code && (
                            <div className="text-danger small mt-1">
                                {validationErrors.email_code}
                            </div>
                        )}
                    </div>
                    {/* 휴대폰 번호 */}
                    <div className="mb-3">
                        <label htmlFor="phone" className="form-label">
                            휴대폰 번호
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            className={`form-control ${validationErrors.phone ? "is-invalid" : ""}`}
                            placeholder="휴대폰 번호를 입력해주세요"
                            onChange={() => setValidationErrors(prev => ({ ...prev, phone: "" }))}
                        />
                        {validationErrors.phone && (
                            <div className="text-danger small mt-1">
                                {validationErrors.phone}
                            </div>
                        )}
                    </div>


                    {/* 회사 정보 */}
                    <div className="mb-3">
                        <label htmlFor="emailCode" className="form-label">
                            회사 이름
                        </label>
                        <input
                            type="text"
                            id="company_company_name"
                            name="company_company_name"
                            className={`form-control ${validationErrors.company_company_name ? "is-invalid" : ""}`}
                            placeholder="회사명을 입력해주세요"
                            maxLength={20}
                            onChange={() => setValidationErrors(prev => ({ ...prev, company_company_name: "" }))}
                        />
                        {validationErrors.company_company_name && (
                            <div className="text-danger small mt-1">
                                {validationErrors.company_company_name}
                            </div>
                        )}
                    </div>
                    {/* 회사 전화 */}
                    <div className="mb-3">
                        <label htmlFor="emailCode" className="form-label">
                            사업자 등록번호
                        </label>
                        <input
                            type="text"
                            id="company_business_number"
                            name="company_business_number"
                            className={`form-control ${validationErrors.company_business_number ? "is-invalid" : ""}`}
                            placeholder="사업자 등록번호를 적어주세요"
                            maxLength={12}
                            onChange={() => setValidationErrors(prev => ({ ...prev, company_business_number: "" }))}
                        />
                        {validationErrors.company_business_number && (
                            <div className="text-danger small mt-1">
                                {validationErrors.company_business_number}
                            </div>
                        )}
                    </div>
                    {/* 회사 주소 */}
                    <div className="mb-3">
                        <label htmlFor="emailCode" className="form-label">
                            회사 주소
                        </label>
                        <input
                            type="text"
                            id="company_company_addr"
                            name="company_company_addr"
                            className={`form-control ${validationErrors.company_company_addr ? "is-invalid" : ""}`}
                            placeholder="회사 주소를 입력해주세요"
                            maxLength={50}
                            onChange={() => setValidationErrors(prev => ({ ...prev, company_company_addr: "" }))}
                        />
                        {validationErrors.company_company_addr && (
                            <div className="text-danger small mt-1">
                                {validationErrors.company_company_addr}
                            </div>
                        )}
                    </div>


                    {/* 회사 상세 주소 */}
                    <div className="mb-3">
                        <label className="form-label">
                            상세 주소
                        </label>
                        <div className="d-flex gap-2">
                            {/* <input
                                type="text"
                                id="company_id"
                                name="company_id"
                                className="form-control"
                                placeholder="동"
                            /> */}
                            <div className="flex-fill">
                                <input
                                    type="text"
                                    id="floor_no"
                                    name="floor_no"
                                    className={`form-control ${validationErrors.floor_no ? "is-invalid" : ""}`}
                                    placeholder="층"
                                    onChange={() => setValidationErrors(prev => ({ ...prev, floor_no: "" }))}
                                />
                                {validationErrors.floor_no && (
                                    <div className="text-danger small mt-1">
                                        {validationErrors.floor_no}
                                    </div>
                                )}
                            </div>
                            <div className="flex-fill">
                                <input
                                    type="text"
                                    id="office_number"
                                    name="office_number"
                                    className={`form-control ${validationErrors.office_number ? "is-invalid" : ""}`}
                                    placeholder="호수"
                                    onChange={() => setValidationErrors(prev => ({ ...prev, office_number: "" }))}
                                />
                                {validationErrors.office_number && (
                                    <div className="text-danger small mt-1">
                                        {validationErrors.office_number}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* 입주민 인증번호 */}
                    <div className="mb-3">
                        <label htmlFor="residentCode" className="form-label">
                            입주민 인증번호
                        </label>
                        <input
                            type="text"
                            id="verification_code"
                            name="verification_code"
                            className={`form-control ${validationErrors.verification_code ? "is-invalid" : ""}`}
                            placeholder="입주민 인증번호를 입력해주세요"
                            onChange={() => setValidationErrors(prev => ({ ...prev, verification_code: "" }))}
                        />
                        {validationErrors.verification_code && (
                            <div className="text-danger small mt-1">
                                {validationErrors.verification_code}
                            </div>
                        )}
                        <div className="form-text">
                            관리사무소에서 발급받은 입주민 인증번호를 입력해주세요.
                        </div>
                    </div>
                    {/* 차량 등록 */}
                    <div className="mb-3">
                        <label htmlFor="carNumber" className="form-label">
                            차량 등록 <span className="text-secondary"></span>
                        </label>
                        <VehicleList vehicles={vehicles} setVehicles={setVehicles}/>
                        {validationErrors.vehicle_list && (
                            <div className="text-danger small mt-1">
                                {validationErrors.vehicle_list}
                            </div>
                        )}
                        {/* <div className="form-text" style={{ marginTop: "1rem" }}>
                            이용할 차량을 최소 1대 등록해주세요.
                        </div> */}
                    </div>

                    {/* 약관 동의 */}
                    <div className="border rounded p-3 mb-4">
                        <div className="form-check mb-2">
                            <input
                                type="checkbox"
                                id="agreeAll"
                                className="form-check-input"
                                checked={isCheckbox1&&isCheckbox2}
                                onChange={ () => {
                                    if (isCheckbox1 && isCheckbox2) {
                                        setIsCheckbox1(false);
                                        setIsCheckbox2(false);
                                    } else {
                                        setIsCheckbox1(true);
                                        setIsCheckbox2(true);
                                    }
                                } }
                            />
                            <label
                                htmlFor="agreeAll"
                                className="form-check-label fw-bold"
                            >
                                전체 약관에 동의합니다.
                            </label>
                        </div>

                        <hr />

                        <div className="form-check mb-2">
                            <input
                                type="checkbox"
                                id="terms"
                                className="form-check-input"
                                checked={isCheckbox1}
                                onChange={() => {
                                    setIsCheckbox1(!isCheckbox1);
                                    setValidationErrors(prev => ({ ...prev, terms: "" }));
                                }}
                            />

                            <label
                                htmlFor="terms"
                                className="form-check-label"
                            >
                                이용약관 동의 <span className="text-danger">(필수)</span>
                            </label>
                            {validationErrors.terms && (
                                <div className="text-danger small mt-1">
                                    {validationErrors.terms}
                                </div>
                            )}
                        </div>

                        <div className="form-check">
                            <input
                                type="checkbox"
                                id="privacy"
                                className="form-check-input"
                                checked={isCheckbox2}
                                onChange={() => {
                                    setIsCheckbox2(!isCheckbox2);
                                    setValidationErrors(prev => ({ ...prev, privacy: "" }));
                                }}
                            />

                            <label
                                htmlFor="privacy"
                                className="form-check-label"
                            >
                                개인정보 수집 및 이용 동의 <span className="text-danger">(필수)</span>
                            </label>
                            {validationErrors.privacy && (
                                <div className="text-danger small mt-1">
                                    {validationErrors.privacy}
                                </div>
                            )}
                        </div>

                    </div>


                    {/* 회원가입 버튼 */}
                    <button
                        type="submit"
                        className="btn btn-primary w-100 mb-3"
                    >
                        회원가입
                    </button>


                    {/* 로그인 이동 */}
                    <div className="text-center small">
                        이미 회원이신가요?{' '}
                        <Link
                            to="/user/login"
                            className="text-decoration-none"
                        >
                            로그인
                        </Link>
                    </div>

                </form>
            </div>
        </div>
    );
}