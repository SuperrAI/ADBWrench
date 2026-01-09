const ShareIcon = ({ 
  width = 20, 
  height = 20, 
  className = "", 
  color = "currentColor",
  ...props 
}) => (
  <svg 
    width={width}
    height={height} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    {...props}
  >
    <path 
      d="M7.5 6.875C7.5 6.875 8.87237 5.17741 9.62775 4.5243C9.74919 4.41931 9.88556 4.3697 10.0211 4.37545C10.1426 4.3806 10.2634 4.43027 10.3724 4.52445C11.1276 5.17767 12.5 6.875 12.5 6.875M10.0211 5V11.875" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M7.5 9.375C6.62492 9.375 6.18737 9.375 5.85314 9.54531C5.55914 9.69513 5.32011 9.93412 5.1703 10.2281C5 10.5624 5 10.9999 5 11.875V12.5C5 13.9731 5 14.7097 5.45764 15.1674C5.91529 15.625 6.65186 15.625 8.125 15.625H11.875C13.3481 15.625 14.0847 15.625 14.5424 15.1674C15 14.7097 15 13.9731 15 12.5V11.875C15 10.9999 15 10.5624 14.8297 10.2281C14.6799 9.93412 14.4409 9.69513 14.1469 9.54531C13.8126 9.375 13.3751 9.375 12.5 9.375" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default ShareIcon;

