const EditIcon = ({ width = 32, height = 32, className = "", ...props }) => (
    <svg 
        width={width} 
        height={height} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
    >
        <path d="M22.9999 21.0002V21.6668C22.9999 23.876 21.2091 25.6668 18.9999 25.6668H10.3333C8.12411 25.6668 6.33325 23.876 6.33325 21.6668V10.3335C6.33325 8.12436 8.12411 6.3335 10.3333 6.3335H13.6666" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20.6081 14.6812L24.9856 10.3037C25.8938 9.39544 25.8938 7.9229 24.9856 7.01467C24.0773 6.10644 22.6048 6.10644 21.6966 7.01467L17.3191 11.3922C16.9553 11.756 16.6972 12.2118 16.5724 12.711L15.6667 16.3335L19.2893 15.4279C19.7884 15.3031 20.2443 15.045 20.6081 14.6812Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.3333 20.3333H18.9999" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.3333 16.3333H12.3333" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.3333 12.3335H12.3333" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default EditIcon; 