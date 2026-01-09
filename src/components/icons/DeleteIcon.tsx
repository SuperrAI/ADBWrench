const DeleteIcon = ({ 
  width = 20, 
  height = 20, 
  className = "", 
  color = "#EF4444",
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
      d="M16.0413 5.41536C16.0413 6.22078 13.3364 6.8737 9.99967 6.8737C6.66295 6.8737 3.95801 6.22078 3.95801 5.41536C3.95801 4.60995 6.66295 3.95703 9.99967 3.95703C13.3364 3.95703 16.0413 4.60995 16.0413 5.41536Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M3.95801 5.625L5.1756 13.235C5.43434 14.8521 6.82942 16.0417 8.46707 16.0417H11.5323C13.1699 16.0417 14.565 14.8521 14.8237 13.235L16.0413 5.625" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M8.33105 10L8.54894 12.4954" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12.1133 10.002L11.852 12.4931" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default DeleteIcon;

