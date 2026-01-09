const DevicesIcon = ({ width = 22, height = 22, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 22 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M7.10425 7.5625V7.10417C7.10425 6.59791 7.51465 6.1875 8.02091 6.1875H16.7292C17.2355 6.1875 17.6459 6.59791 17.6459 7.10417V16.7292C17.6459 17.2354 17.2355 17.6458 16.7292 17.6458H11.6876M4.35425 16.7292V10.7708C4.35425 10.2646 4.76465 9.85417 5.27091 9.85417H8.47925C8.98551 9.85417 9.39592 10.2646 9.39592 10.7708V16.7292C9.39592 17.2354 8.98551 17.6458 8.47925 17.6458H5.27091C4.76465 17.6458 4.35425 17.2354 4.35425 16.7292Z" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default DevicesIcon; 