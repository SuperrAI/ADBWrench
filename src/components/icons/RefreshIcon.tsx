const RefreshIcon = ({ width = 19, height = 18, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 19 18" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M5.6551 5.15486C7.77858 3.03139 11.2214 3.03139 13.3449 5.15486C15.4684 7.27834 15.4684 10.7212 13.3449 12.8446C11.2214 14.9681 7.77858 14.9681 5.6551 12.8446C5.17975 12.3693 4.81081 11.8278 4.54828 11.2498" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.0625 14.4368V11.8118C4.0625 11.3976 4.39829 11.0618 4.8125 11.0618H7.4375" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default RefreshIcon; 