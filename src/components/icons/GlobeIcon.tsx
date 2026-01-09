const GlobeIcon = ({ width = 28, height = 28, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 28 28" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M14 25C20.0751 25 25 20.0751 25 14C25 7.92487 20.0751 3 14 3C7.92487 3 3 7.92487 3 14C3 20.0751 7.92487 25 14 25Z" stroke="black" strokeWidth="2"/>
        <path d="M14 25C16.2091 25 18 20.0751 18 14C18 7.92487 16.2091 3 14 3C11.7909 3 10 7.92487 10 14C10 20.0751 11.7909 25 14 25Z" stroke="black" strokeWidth="2"/>
        <path d="M3 14H25" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default GlobeIcon; 