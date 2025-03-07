// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// 프록시 구조 검색하기!!
// 유니스왑
// 이상거래 타AI 

contract GoldToken {
    // 토큰의 기본 정보 설정
    string public name = "Gold Token";  
    string public symbol = "GOLD";      
    uint8 private _decimals = 18;       
    uint private _totalSupply;          
    address public owner;               

    // 각 계정의 토큰 잔액 저장
    mapping(address => uint) balances;  

    // 대리 송금 허락량 저장 (소유자 → 대리인 → 허용량)
    mapping(address => mapping(address => uint)) allowances;  

    // 토큰 전송 이벤트
    event Transfer(address indexed from, address indexed to, uint tokens);  

    // 대리 송금 허용 이벤트
    event Approval(address indexed owner, address indexed spender, uint tokens);

    // 관리자 권한 체크
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute this"); // 오직 소유자만 실행할 수 있습니다.
        _;
    }

    // 스마트 컨트랙트 배포 시 초기 토큰 발행
    constructor(uint _amount) {
        require(_amount > 0, "Total supply must be greater than zero"); // 총 공급량은 0보다 커야 합니다.
        owner = msg.sender;  // 배포자를 토큰 소유자로 설정
        _totalSupply = _amount * (10 ** _decimals);  // 소수점 고려한 총 공급량 설정
        balances[owner] = _totalSupply;  // 관리자에게 모든 토큰 할당
    }

    // 소수점 이하 자리수 반환
    function decimals() public view returns (uint8) {
        return _decimals;
    }

    // 전체 토큰 공급량 조회
    function totalSupply() public view returns (uint) {
        return _totalSupply;
    }

    // 특정 계정의 잔액 조회
    function balanceOf(address _account) public view returns (uint) {
        return balances[_account];
    }

    // 토큰 전송 + 향후 수수료 시스템 도입
    function transfer(address _to, uint _tokens) public returns (bool) {
        require(_to != address(0), "Invalid address"); // 유효한 주소인지 검사
        require(balances[msg.sender] >= _tokens, "Insufficient balance"); // 잔액 충분한지 확인

        balances[msg.sender] -= _tokens;  // 송신자의 잔고 감소
        balances[_to] += _tokens;         // 수신자의 잔고 증가

        emit Transfer(msg.sender, _to, _tokens);  // 송금 이벤트 발생
        return true;
    }

    // 대리 전송 허용
    function approve(address _spender, uint _tokens) public returns (bool) {
        require(_spender != address(0), "Invalid address");  

        allowances[msg.sender][_spender] = _tokens;  // 대리인에게 송금 허용량 설정

        emit Approval(msg.sender, _spender, _tokens);  // 허용 이벤트 발생
        return true;
    }

    // 대리 전송 실행
    function transferFrom(address _from, address _to, uint _tokens) public returns (bool) {
        require(_from != address(0) && _to != address(0), "Invalid address"); 
        require(balances[_from] >= _tokens, "Insufficient balance"); 
        require(allowances[_from][msg.sender] >= _tokens, "Allowance exceeded"); 

        balances[_from] -= _tokens;  
        allowances[_from][msg.sender] -= _tokens;  
        balances[_to] += _tokens;  

        emit Transfer(_from, _to, _tokens);  
        return true;
    }

    // 새로운 토큰 발행 (관리자만 가능)
    function mint(address _to, uint _amount) public onlyOwner {
        uint mintAmount = _amount * (10 ** _decimals);  
        _totalSupply += mintAmount;  
        balances[_to] += mintAmount;  

        emit Transfer(address(0), _to, mintAmount);  
    }

    // 토큰 소각 (사용자가 직접 가능)
    function burn(uint _amount) public {
        uint burnAmount = _amount * (10 ** _decimals);  
        require(balances[msg.sender] >= burnAmount, "Insufficient balance to burn");  

        balances[msg.sender] -= burnAmount;  
        _totalSupply -= burnAmount;  

        emit Transfer(msg.sender, address(0), burnAmount);  
    }
}