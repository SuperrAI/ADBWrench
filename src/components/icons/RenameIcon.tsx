const RenameIcon = ({ 
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
      d="M12.344 5.61151L13.366 4.58939C13.9305 4.02489 14.8458 4.02489 15.4103 4.58939C15.9748 5.15389 15.9748 6.06912 15.4103 6.63362L14.3882 7.65574M12.344 5.61151L6.34008 11.6154C5.57788 12.3776 5.19677 12.7587 4.93726 13.2231C4.67775 13.6875 4.41666 14.7841 4.16699 15.8327C5.2156 15.583 6.3122 15.3219 6.7766 15.0624C7.24101 14.8029 7.62211 14.4218 8.38432 13.6596L14.3882 7.65574M12.344 5.61151L14.3882 7.65574" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default RenameIcon;

