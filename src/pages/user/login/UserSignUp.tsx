import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VehicleList from '../../../components/common/VehicleList';
// import { checkUsername, officeSignup, signupData, Vehicle } from '../../../auth/actions/authActions';
import {
    checkUsername,
    checkEmail,
    officeSignup,
    sendEmailVerificationCode,
    signupData,
    Vehicle,
    verifyEmailVerificationCode,
} from '../../../auth/actions/authActions';

/**
 * 입주민 회원가입 페이지 (/user/signup)
 */

export interface vehicleState {
    vehicles: Vehicle[],
    setVehicles: (vehicles: Vehicle[]) => void,
}

const getEmailVerificationMessage = (reason: string): string => {
    const messages: Record<string, string> = {
        sent: "인증번호를 이메일로 보냈습니다.",
        ok: "이메일 인증이 완료되었습니다.",
        wrong: "인증번호가 올바르지 않습니다.",
        expired: "인증번호가 만료되었습니다. 다시 발송해주세요.",
        exceeded: "인증 시도 횟수를 초과했습니다. 인증번호를 다시 발송해주세요.",
        invalid_email: "이메일 주소를 확인해주세요.",
        invalid_request: "이메일과 인증번호를 확인해주세요.",
        send_failed: "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.",
        verify_failed: "인증 확인에 실패했습니다. 다시 시도해주세요.",
    };

    return messages[reason] ?? "이메일 인증 중 오류가 발생했습니다.";
};

export default function UserSignUp() {
    const [isCheckbox1, setIsCheckbox1] = useState(false);
    const [isCheckbox2, setIsCheckbox2] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [username, setUsername] = useState<string>("");
    const [checkedUsername, setCheckedUsername] = useState<string>("");
    const [isAvailableUsername, setIsAvailableUsername] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    // email
    const [email, setEmail] = useState("");
    const [emailCode, setEmailCode] = useState("");
    const [verifiedEmail, setVerifiedEmail] = useState("");
    const [emailBusy, setEmailBusy] = useState(false);
    const [signupBusy, setSignupBusy] = useState(false);
    const [emailMessage, setEmailMessage] = useState("");
    const isEmailVerified = 
        email.trim() !== "" &&
        verifiedEmail !== "" &&
        verifiedEmail === email.trim();
    const [policyType, setPolicyType] = useState<"terms" | "privacy" | null>(null);
    const [isAvailableEmail, setIsAvailableEmail] = useState<boolean>(false);
    const [checkedEmail, setCheckedEmail] = useState<string>("");   

    const navigate = useNavigate();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (verifiedEmail !== email.trim()) {
            setValidationErrors(prev => ({
                ...prev,
                email_code: "이메일 인증을 완료해주세요.",
            }));
            return;
        }

        if (!validation()) {
            return;
        }

        const formData = new FormData(event.currentTarget);

        const signupPayload: signupData = {
            username: String(formData.get("username") ?? ""),
            password: String(formData.get("password") ?? ""),
            password_confirm: String(formData.get("password_confirm") ?? ""),
            email: email.trim(),
            email_code: emailCode.trim(),
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

        setSignupBusy(true);

        try {
            const result = await officeSignup(signupPayload);

            if (!result) {
                alert("회원가입에 실패했습니다. 입력 내용을 확인해주세요.");
                return;
            }

            setUserInfo(result.data);
            alert("가입이 정상적으로 완료되었습니다.");
            navigate("/user/login");
        } finally {
            setSignupBusy(false);
        }
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

    const userEmailCheck = async () => {
        const normalizedEmail = email.trim();

        if (
            !normalizedEmail ||
            normalizedEmail.length > 30 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            setIsAvailableEmail(false);
            setCheckedEmail("");
            setValidationErrors(prev => ({
                ...prev,
                email: "올바른 이메일 주소를 입력해주세요.",
            }));
            return;
        }

        const result = await checkEmail(normalizedEmail);

        if (result === null) {
            setIsAvailableEmail(false);
            setCheckedEmail("");
            setValidationErrors(prev => ({
                ...prev,
                email: "이메일 중복 확인에 실패했습니다. 다시 시도해주세요.",
            }));
            return;
        }

        if (result) {
            setIsAvailableEmail(false);
            setCheckedEmail("");
            setVerifiedEmail("");
            setEmailCode("");
            setEmailMessage("");

            setValidationErrors(prev => ({
                ...prev,
                email: "이미 사용 중인 이메일입니다.",
            }));
        } else {
            setIsAvailableEmail(true);
            setCheckedEmail(normalizedEmail);

            setValidationErrors(prev => ({
                ...prev,
                email: "",
            }));
        }
    };

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

        // if (!verificationCode) {
        //     errors.verification_code = "입주민 인증번호를 입력해주세요.";
        // }

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


    const handleSendEmailCode = async () => {
        const normalizedEmail = email.trim();

        if (
            normalizedEmail.length > 30 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            setValidationErrors(prev => ({
                ...prev,
                email: "올바른 이메일 주소를 입력해주세요.",
            }));
            return;
        }

        setEmailBusy(true);
        setVerifiedEmail("");
        setEmailCode("");
        setEmailMessage("");

        try {
            const result = await sendEmailVerificationCode(normalizedEmail);
            setEmailMessage(getEmailVerificationMessage(result.reason));
        } finally {
            setEmailBusy(false);
        }
    };

    const handleVerifyEmailCode = async () => {
        const normalizedEmail = email.trim();

        if (!/^\d{6}$/.test(emailCode.trim())) {
            setEmailMessage("인증번호 6자리를 입력해주세요.");
            return;
        }

        setEmailBusy(true);
        setEmailMessage("");

        try {
            const result = await verifyEmailVerificationCode(
                normalizedEmail,
                emailCode
            );

            if (result.success) {
                setVerifiedEmail(normalizedEmail);
            } else {
                setVerifiedEmail("");
            }

            setEmailMessage(getEmailVerificationMessage(result.reason));
        } finally {
            setEmailBusy(false);
        }
    };
        

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
                                value={email}
                                maxLength={30}
                                className={`form-control ${validationErrors.email ? "is-invalid" : ""}`}
                                placeholder="이메일을 입력해주세요"
                                onChange={event => {
                                    setEmail(event.target.value);
                                    setIsAvailableEmail(false);
                                    setCheckedEmail("");
                                    setVerifiedEmail("");
                                    setEmailCode("");
                                    setEmailMessage("");

                                    setValidationErrors(prev => ({
                                        ...prev,
                                        email: "",
                                        email_code: "",
                                    }));
                                }}
                            />

                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                disabled={emailBusy}
                                onClick={userEmailCheck}
                            >
                                중복 확인
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                disabled={
                                    emailBusy ||
                                    !isAvailableEmail ||
                                    checkedEmail !== email.trim() ||
                                    isEmailVerified
                                }
                                onClick={handleSendEmailCode}
                            >
                                {emailBusy
                                    ? "처리 중..."
                                    : isEmailVerified
                                        ? "인증 완료"
                                        : "인증번호 발송"}
                            </button>
                        </div>

                        {validationErrors.email && (
                            <div className="text-danger small mt-1">
                                {validationErrors.email}
                            </div>
                        )}

                        {!validationErrors.email &&
                            isAvailableEmail &&
                            checkedEmail === email.trim() && (
                                <div className="text-success small mt-1">
                                    사용할 수 있는 이메일입니다.
                                </div>
                            )}

                        {emailMessage && (
                            <div
                                className={`small mt-1 ${
                                    isEmailVerified ? "text-success" : "text-secondary"
                                }`}
                            >
                                {emailMessage}
                            </div>
                        )}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="email_code" className="form-label">
                            인증번호
                        </label>

                        <div className="input-group">
                            <input
                                type="text"
                                id="email_code"
                                name="email_code"
                                inputMode="numeric"
                                maxLength={6}
                                value={emailCode}
                                className={`form-control ${validationErrors.email_code ? "is-invalid" : ""}`}
                                placeholder="이메일로 받은 인증번호를 입력해주세요"
                                onChange={event => {
                                    setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                                    setValidationErrors(prev => ({ ...prev, email_code: "" }));
                                }}
                            />

                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                disabled={emailBusy || isEmailVerified || emailCode.length !== 6}
                                onClick={handleVerifyEmailCode}
                            >
                                {isEmailVerified ? "인증 완료" : "인증 확인"}
                            </button>
                        </div>

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
                    {/*<div className="mb-3">
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
                    </div>*/}
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
                    <div className="form-check mb-3">
                        <input
                            type="checkbox"
                            id="agreeAll"
                            className="form-check-input"
                            checked={isCheckbox1 && isCheckbox2}
                            onChange={() => {
                                if (isCheckbox1 && isCheckbox2) {
                                    setIsCheckbox1(false);
                                    setIsCheckbox2(false);
                                } else {
                                    setIsCheckbox1(true);
                                    setIsCheckbox2(true);
                                }
                            }}
                        />
                        <label htmlFor="agreeAll" className="form-check-label fw-bold">
                            전체 약관에 동의합니다.
                        </label>
                    </div>

                    <hr />

                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center gap-2">
                            <div className="form-check">
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
                                <label htmlFor="terms" className="form-check-label">
                                    이용약관 동의 <span className="text-danger">(필수)</span>
                                </label>
                            </div>

                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setPolicyType("terms")}
                            >
                                내용 보기
                            </button>
                        </div>

                        {validationErrors.terms && (
                            <div className="text-danger small mt-1">
                                {validationErrors.terms}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="d-flex justify-content-between align-items-center gap-2">
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
                                <label htmlFor="privacy" className="form-check-label">
                                    개인정보 수집 및 이용 동의{" "}
                                    <span className="text-danger">(필수)</span>
                                </label>
                            </div>

                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setPolicyType("privacy")}
                            >
                                내용 보기
                            </button>
                        </div>

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

                    {/* <button
                        type="submit"
                        className="btn btn-primary w-100 mb-3"
                        disabled={signupBusy}
                    >
                        {signupBusy ? "가입 처리 중..." : "회원가입"}
                    </button> */}


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



            {/* 약관 상세 팝업 */}
            {policyType !== null && (
                <div
                    onClick={() => setPolicyType(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 1050,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "16px",
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="policy-title"
                        onClick={event => event.stopPropagation()}
                        className="bg-white rounded shadow"
                        style={{
                            width: "100%",
                            maxWidth: "560px",
                            maxHeight: "80vh",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {/* 팝업 제목 */}
                        <div className="d-flex justify-content-between align-items-center border-bottom p-3">
                            <h5 id="policy-title" className="fw-bold mb-0">
                                {policyType === "terms"
                                    ? "이용약관"
                                    : "개인정보 수집 및 이용 동의"}
                            </h5>

                            <button
                                type="button"
                                className="btn-close"
                                aria-label="닫기"
                                onClick={() => setPolicyType(null)}
                            />
                        </div>

                        {/* 약관 내용 */}
                        <div className="p-4 overflow-auto">
                            {policyType === "terms" ? (
                                <>
                                    <h6 className="fw-bold">제1조 (목적)</h6>
                                    <p>
                                        본 약관은 주차관제 서비스의 이용과 관련하여
                                        서비스 제공자와 이용자 간의 권리, 의무 및
                                        책임사항을 정하는 것을 목적으로 합니다.
                                    </p>

                                    <h6 className="fw-bold mt-4">제2조 (서비스 이용)</h6>
                                    <p>
                                        이용자는 회원가입 시 정확한 정보를 제공해야 하며,
                                        서비스 이용 시 관련 법령과 서비스 운영정책을
                                        준수해야 합니다.
                                    </p>

                                    <h6 className="fw-bold mt-4">제3조 (회원정보 관리)</h6>
                                    <p>
                                        이용자는 자신의 계정정보를 안전하게 관리해야 하며,
                                        타인의 정보를 무단으로 사용해서는 안 됩니다.
                                    </p>

                                    <h6 className="fw-bold mt-4">제4조 (서비스 이용 제한)</h6>
                                    <p>
                                        서비스 운영을 방해하거나 관련 법령 및 약관을
                                        위반하는 경우 서비스 이용이 제한될 수 있습니다.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h6 className="fw-bold">1. 개인정보 수집 항목</h6>
                                    <p>
                                        회원가입 및 서비스 제공을 위해 아이디, 비밀번호,
                                        이메일 주소, 휴대폰 번호, 회사 정보 및 등록 차량
                                        정보를 수집할 수 있습니다.
                                    </p>

                                    <h6 className="fw-bold mt-4">2. 개인정보 수집 및 이용 목적</h6>
                                    <p>
                                        회원 식별, 계정 관리, 이메일 인증, 주차관제 서비스
                                        제공 및 이용 관련 안내를 위해 사용합니다.
                                    </p>

                                    <h6 className="fw-bold mt-4">3. 개인정보 보유 및 이용 기간</h6>
                                    <p>
                                        개인정보는 서비스 이용 목적이 달성되거나 회원 탈퇴
                                        등으로 보유가 불필요해질 때 관련 법령에 따라
                                        파기합니다. 법령에 따라 보관해야 하는 정보는
                                        해당 기간 동안 보관할 수 있습니다.
                                    </p>

                                    <h6 className="fw-bold mt-4">4. 동의 거부 권리</h6>
                                    <p>
                                        이용자는 개인정보 수집 및 이용에 대한 동의를
                                        거부할 수 있습니다. 다만 필수 항목에 동의하지
                                        않으면 회원가입 및 서비스 이용이 제한될 수 있습니다.
                                    </p>
                                </>
                            )}
                        </div>

                        {/* 팝업 하단 버튼 */}
                        <div className="border-top p-3 text-end">
                            <button
                                type="button"
                                className="btn btn-primary px-4"
                                onClick={() => setPolicyType(null)}
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}