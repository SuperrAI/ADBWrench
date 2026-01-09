const PdfBookIcon = ({ width = 32, height = 32, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M25.6662 7.66732C25.6662 6.93094 25.0692 6.33398 24.3328 6.33398H18.6662C17.1934 6.33398 15.9995 7.52789 15.9995 9.00065V25.6673L17.1041 24.5627C18.1043 23.5626 19.4608 23.0007 20.8753 23.0007H24.3328C25.0692 23.0007 25.6662 22.4037 25.6662 21.6673V7.66732Z" stroke="#FF9662" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.3335 7.66732C6.3335 6.93094 6.93045 6.33398 7.66683 6.33398H13.3335C14.8063 6.33398 16.0002 7.52789 16.0002 9.00065V25.6673L14.8956 24.5627C13.8954 23.5626 12.5388 23.0007 11.1244 23.0007H7.66683C6.93045 23.0007 6.3335 22.4037 6.3335 21.6673V7.66732Z" stroke="#FF9662" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default PdfBookIcon; 