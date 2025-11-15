function isPasswordValid(password){
	const hasUpper = /[A-Z]/.test(password);
	const hasLower = /[a-z]/.test(password);
	const hasNumber = /[0-9]/.test(password);
	const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
	const isLongEnough = password.length >= 8;

	return hasUpper && hasLower && hasNumber && hasSymbol && isLongEnough;
}

export default isPasswordValid;
