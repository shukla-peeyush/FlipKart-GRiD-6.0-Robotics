import React from 'react';
import { FileText, Hash, Leaf, Shield, Clock, Info } from 'lucide-react';
import type { ServiceType, ServiceInfo } from '../types';

interface FeatureSelectorProps {
  selectedServices: ServiceType[];
  onToggle: (service: ServiceType) => void;
  disabled?: boolean;
}

const FeatureSelector: React.FC<FeatureSelectorProps> = ({
  selectedServices,
  onToggle,
  disabled = false
}) => {
  const services: ServiceInfo[] = [
    {
      service: 'OCR',
      title: 'Product Description',
      description: 'Extract text and product details using OCR',
      estimatedTime: '~2s',
      tooltip: 'Optical Character Recognition to extract product names, ingredients, expiration dates, and other text information from product packaging.'
    },
    {
      service: 'ProductCount',
      title: 'Product Count',
      description: 'Detect and count products using object detection',
      estimatedTime: '~3s',
      tooltip: 'Computer vision-based object detection to identify and count individual products in the image, with bounding box visualization.'
    },
    {
      service: 'Freshness',
      title: 'Freshness Detection',
      description: 'Analyze freshness of perishable items using AI',
      estimatedTime: '~4s',
      tooltip: 'AI-powered freshness analysis for fruits, vegetables, and other perishable items. Provides freshness scores and quality indicators.'
    },
    {
      service: 'BrandRecognition',
      title: 'Brand Recognition',
      description: 'Identify brands and detect counterfeits',
      estimatedTime: '~3s',
      tooltip: 'Brand logo detection and authenticity verification. Helps identify counterfeit products by comparing against known brand patterns.'
    }
  ];

  const getServiceIcon = (service: ServiceType) => {
    switch (service) {
      case 'OCR':
        return <FileText className="w-5 h-5" />;
      case 'ProductCount':
        return <Hash className="w-5 h-5" />;
      case 'Freshness':
        return <Leaf className="w-5 h-5" />;
      case 'BrandRecognition':
        return <Shield className="w-5 h-5" />;
    }
  };

  const isSelected = (service: ServiceType): boolean => {
    return selectedServices.includes(service);
  };

  const getConfidenceColor = (service: ServiceType): string => {
    switch (service) {
      case 'OCR':
        return 'bg-blue-100 text-blue-800';
      case 'ProductCount':
        return 'bg-green-100 text-green-800';
      case 'Freshness':
        return 'bg-orange-100 text-orange-800';
      case 'BrandRecognition':
        return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="card">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Select Analysis Services</h3>
          <span className="text-sm text-gray-500">
            {selectedServices.length} of {services.length} selected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((serviceInfo) => {
            const selected = isSelected(serviceInfo.service);
            const confidenceColor = getConfidenceColor(serviceInfo.service);
            
            return (
              <div
                key={serviceInfo.service}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  selected ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !disabled && onToggle(serviceInfo.service)}>
                
                {/* Selection indicator */}
                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"
                }`}>
                  {selected && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Icon and title */}
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${confidenceColor}`}>
                      {getServiceIcon(serviceInfo.service)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{serviceInfo.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{serviceInfo.description}</p>
                    </div>
                  </div>

                  {/* Estimated time and info */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Clock className="w-3 h-3 mr-1" />
                      {serviceInfo.estimatedTime}
                    </span>
                    
                    <button
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title={serviceInfo.tooltip}
                      aria-label="More information">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              className="btn-secondary text-sm"
              onClick={() => !disabled && services.forEach(s => !isSelected(s.service) && onToggle(s.service))}
              disabled={disabled}>
              Select All
            </button>
            <button
              className="btn-secondary text-sm"
              onClick={() => !disabled && selectedServices.forEach(onToggle)}
              disabled={disabled}>
              Clear All
            </button>
          </div>
          
          {selectedServices.length > 0 && (
            <div className="text-sm text-gray-600">
              <span>Estimated total time: </span>
              <span className="font-medium">
                ~{selectedServices.length * 3}s
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureSelector;
