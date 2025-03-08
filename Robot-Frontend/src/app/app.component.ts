import { Component, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import * as nipplejs from 'nipplejs';
import * as ROSLIB from 'roslib';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef;
  private ros!: ROSLIB.Ros;
  private leftJoystickPublisher!: ROSLIB.Topic;
  private rightJoystickPublisher!: ROSLIB.Topic;

  ngOnInit() {
    this.initRosConnection();
    this.initJoystick();
  }

  ngAfterViewInit() {
    this.startCameraFeed();
  }

  startCameraFeed() {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        this.videoElement.nativeElement.srcObject = stream;
      })
      .catch((error) => console.error('Error accessing webcam:', error));
  }

  initRosConnection() {
    this.ros = new ROSLIB.Ros({
      url: 'ws://192.168.1.29:9090' // Replace with actual IP
    });

    this.ros.on('connection', () => {
      console.log('Connected to ROS 2 via rosbridge');
    });

    this.ros.on('error', (error: any) => { 
      console.error('WebSocket Error:', error);
    });
    

    this.ros.on('close', () => {
      console.log('Connection to rosbridge closed.');
    });

    // Define publishers for joystick topics
    this.leftJoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/joystick_left',
      messageType: 'geometry_msgs/Twist'
    });

    this.rightJoystickPublisher = new ROSLIB.Topic({
      ros: this.ros,
      name: '/steering_angle',
      messageType: 'std_msgs/Float32'
    });
  }

  sendJoystickCommand(publisher: ROSLIB.Topic, angle: number) {
    console.log(`Publishing to ${publisher.name}: angle=${angle}`);
    
    const message = new ROSLIB.Message({
      data: angle
    });

    publisher.publish(message);
  }


  initJoystick() {
    const leftJoystickElement = document.getElementById('joystick-left');
    const rightJoystickElement = document.getElementById('joystick-right');

    if (leftJoystickElement) {
      const leftJoystick = nipplejs.create({
        zone: leftJoystickElement,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'blue',
        size: 100,
        lockY: true // Left joystick moves only up/down
      });

      leftJoystick.on('move', (event, data) => {
        if (!data.vector) return; // Ignore if no movement detected

          const y = data.vector.y; // Invert y-axis (up is negative)
          
          // Map y to speed range (-100 to -20 for reverse, 20 to 100 for forward)
          let speed = 0;
          if (y > 0) {
            // Forward motion: Map (0 to 1) → (20 to 100)
            speed = Math.round(20 + y * 80);
          } else if (y < 0) {
            // Backward motion: Map (-1 to 0) → (-100 to -20)
            speed = Math.round(-20 + y * 80);
          }

          console.log(`Left Joystick Speed: ${speed}`);

          this.sendJoystickCommand(this.leftJoystickPublisher, speed);
      });

      leftJoystick.on('end', () => {
        this.sendJoystickCommand(this.leftJoystickPublisher, 0);
      });
    }

    if (rightJoystickElement) {
      const rightJoystick = nipplejs.create({
        zone: rightJoystickElement,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'red',
        size: 100,
        lockX: true // Right joystick moves only left/right
      });

      rightJoystick.on('move', (event, data) => {
        if (!data.vector) return; // Ignore if no movement detected

          const x = data.vector.x; // Get horizontal movement (-1 to 1)
          const degrees = Math.round((1 - x) * 90); // Map from 0° (right) to 180° (left)

          console.log(`Joystick Right Angle: ${degrees}°`);

          this.sendJoystickCommand(this.rightJoystickPublisher, degrees);
      });

      rightJoystick.on('end', () => {
        this.sendJoystickCommand(this.rightJoystickPublisher, 90);
      });
    }
  }
}
