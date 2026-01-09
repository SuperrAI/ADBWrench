const LoginIcon = ({ width = 22, height = 22, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 22 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M8.9375 8.021L12.1458 11.0002L8.9375 13.9793" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.9375 4.354H15.8125C16.825 4.354 17.6458 5.17482 17.6458 6.18734V15.8123C17.6458 16.8249 16.825 17.6457 15.8125 17.6457H8.9375" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.9166 11H4.35413" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default LoginIcon; 